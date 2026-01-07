from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse
import json
from .models import User, Role, Course , CourseEnrollment ,Assignment , Announcement
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .serializers import CourseListSerializer , StudentAssignmentSerializer , AnnouncementSerializer, CreateAnnouncementSerializer
import hashlib
import logging

logger = logging.getLogger(__name__)

#----------------------hamza-----------------------------
# Add to existing imports
from blockchain.interact import (
    create_assignment as blockchain_create_assignment,
    submit_assignment as blockchain_submit_assignment,
    publish_result as blockchain_publish_result,
    get_blockchain_info,
    get_transaction_receipt
)
from Crypto.PublicKey import RSA
from Crypto.Cipher import PKCS1_OAEP
import base64
#----------------------hamza-----------------------------

#====================================login view for all users (students, professors, admins)====================================#

@csrf_exempt
def login_view(request):
    if request.method == 'POST':
        try:
            # Parse JSON data from frontend
            data = json.loads(request.body)
            email = data.get('email')
            password = data.get('password')
            role_name = data.get('role')  # student, professor, or admin
            
            # Validate input
            if not email or not password or not role_name:
                return JsonResponse({
                    'success': False,
                    'message': 'Email, password, and role are required'
                }, status=400)
            
            # Check if user exists
            try:
                user = User.objects.get(email=email)
            except User.DoesNotExist:
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid credentials'
                }, status=401)
            
            # Verify password
            if not user.check_password(password):
                return JsonResponse({
                    'success': False,
                    'message': 'Invalid credentials'
                }, status=401)
            
            # Verify role
            if user.role.rolename != role_name:
                return JsonResponse({
                    'success': False,
                    'message': f'User is not registered as {role_name}'
                }, status=403)
            
            # Success - Return user data
            return JsonResponse({
                'success': True,
                'message': 'Login successful',
                'token': f'token_{user.id}_{user.email}',  # Simple token (you can use JWT later)
                'user': {
                    'id': user.id,
                    'name': user.firstname + ' ' + user.lastname,
                    'email': user.email,
                    'role': user.role.rolename
                }
            }, status=200)
            
        except json.JSONDecodeError:
            return JsonResponse({
                'success': False,
                'message': 'Invalid JSON data'
            }, status=400)
        except Exception as e:
            return JsonResponse({
                'success': False,
                'message': f'Server error: {str(e)}'
            }, status=500)
    
    return JsonResponse({
        'success': False,
        'message': 'Only POST method is allowed'
    }, status=405)



#====================================Professor Courses View====================================#


# blocknet/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.http import JsonResponse
from .models import Course, User
from .serializers import CourseListSerializer

class ProfessorCoursesAPIView(APIView):
    permission_classes = [AllowAny]  # Pas d'auth, réseau limité ENSA

    def get(self, request):
        # Récupère l'email du professeur depuis les query params (envoyé par le front)
        professor_email = request.GET.get('professor_email')

        if not professor_email:
            return JsonResponse({"error": "professor_email manquant"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename="professor")
        except User.DoesNotExist:
            return JsonResponse({"error": "Professeur non trouvé"}, status=404)

        # Filtre uniquement les cours de CE professeur
        courses = Course.objects.filter(professor=professor)

        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)  # [] si aucun cours → géré côté front
    


# blocknet/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from .models import Assignment, User
from .serializers import AssignmentSerializer  # on va le créer

class ProfessorAssignmentsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        professor_email = request.GET.get('professor_email')
        if not professor_email:
            return Response({"error": "professor_email requis"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
            assignments = Assignment.objects.filter(professor=professor).select_related('course')

            data = []
            for ass in assignments:
                data.append({
                    "id": ass.id,
                    "title": ass.title,
                    "description": ass.description,
                    "course_name": ass.course.course_name,
                    "course_code": ass.course.course_code,
                    "due_date": ass.due_date.isoformat(),
                    "created_at": ass.created_at.isoformat(),
                    "submissions_count": ass.submissions.count(),
                    "total_students": ass.course.enrollments.count(),
                    "blockchain_transaction_hash": ass.blockchain_transaction_hash or "",
                })

            return Response(data)
        except User.DoesNotExist:
            return Response([], status=200)
        


# blocknet/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny  # ENSA network only
from .models import Assignment
from .serializers import CreateAssignmentSerializer





class CreateAssignmentAPIView(APIView):
    permission_classes = [AllowAny]  # Limited to ENSA network

    def post(self, request):
        serializer = CreateAssignmentSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        try:
            # This calls your perfect serializer → creates assignment + validates professor/course
            assignment = serializer.save()

            # --------------------------Hamza---------------------------------
            # ----------------------------------------------------------- 
            # BLOCKCHAIN INTEGRATION
            # -----------------------------------------------------------
            try:
                # Get professor from request
                professor = User.objects.get(
                    email=request.data.get('professor_email'), 
                    role__rolename='professor'
                )

                from blockchain.interact import refund_user_if_needed
                refund_user_if_needed(professor.wallet_address, min_balance=10.0)
                
                # Skip blockchain if professor has no profile
                if not professor.has_blockchain_profile:
                    logger.warning(f"Professor {professor.email} has no blockchain profile")                        

                else:
                    from blockchain.utils import decrypt_private_key
                    
                    blockchain_result = blockchain_create_assignment(
                        teacher_address=professor.wallet_address,
                        teacher_private_key=decrypt_private_key(professor.encrypted_private_key),
                        title=assignment.title,
                        description=assignment.description,
                        deadline_timestamp=int(assignment.due_date.timestamp()),
                        rsa_public_key=assignment.public_key,
                        assignment_file_hash=hashlib.sha256(
                            f"{assignment.title}{assignment.description}".encode()
                        ).hexdigest()
                    )
                    
                    if blockchain_result['success']:
                        assignment.blockchain_transaction_hash = blockchain_result['tx_hash']
                        assignment.blockchain_assignment_id = blockchain_result['assignment_id']
                        assignment.save()
                        logger.info(f"Assignment {assignment.id} published to blockchain: {blockchain_result['tx_hash']}")
                    else:
                        logger.error(f"Blockchain failed (non-blocking): {blockchain_result.get('error')}")
                            
            except Exception as e:
                logger.error(f"Blockchain integration error: {e}")
                # Non-blocking: assignment still created even if blockchain fails

            # ----------------------------Hamza-------------------------------

            # Success response 
            return Response({
                "success": True,
                "assignment": {
                    "id": assignment.id,
                    "title": assignment.title,
                    "course": {
                        "name": assignment.course.course_name,
                        "code": assignment.course.course_code
                    },
                    "due_date": assignment.due_date,
                    "created_at": assignment.created_at,
                    "public_key_saved": True,
                    "blockchain_status": "pending"  # Will become "confirmed" when your friend adds it
                },
                "message": "Assignment created successfully. Public key saved. Private key copied to your clipboard — save it securely!"
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            # This should never happen thanks to serializer validation, but safe anyway
            return Response({
                "success": False,
                "error": str(e)
            }, status=status.HTTP_400_BAD_REQUEST)



# blocknet/views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from .models import Submission, Assignment, User
from .serializers import ProfessorSubmissionSerializer

class ProfessorSubmissionsAPIView(APIView):
    permission_classes = [AllowAny]  # À sécuriser avec auth plus tard si besoin

    def get(self, request):
        professor_email = request.GET.get('professor_email')
        if not professor_email:
            return Response({"error": "professor_email requis"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
        except User.DoesNotExist:
            return Response([], status=200)  # Pas d'erreur, juste vide

        # Toutes les soumissions des devoirs du professeur
        submissions = Submission.objects.filter(
            assignment__professor=professor
        ).select_related(
            'student', 'assignment', 'assignment__course'
        ).order_by('-submitted_at')

        serializer = ProfessorSubmissionSerializer(submissions, many=True)
        return Response(serializer.data)
    


class ProfessorPendingSubmissionsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        professor_email = request.GET.get('professor_email')
        if not professor_email:
            return Response({"error": "professor_email requis"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
        except User.DoesNotExist:
            return Response([], status=200)

        pending = Submission.objects.filter(
            assignment__professor=professor,
            status='submitted'  # Seulement celles pas encore notées
        ).select_related(
            'student', 'assignment', 'assignment__course'
        ).order_by('-submitted_at')

        data = []
        for sub in pending:
            data.append({
                "id": sub.id,
                "student_fullname": sub.student.fullname,
                "student_email": sub.student.email,
                "assignment_title": sub.assignment.title,
                "course_name": sub.assignment.course.course_name,
                "course_code": sub.assignment.course.course_code,
                "encrypted_content": sub.encrypted_content,
                "student_id_hash": sub.student_id_hash,
                "submitted_at": sub.submitted_at,
            })

        return Response(data)


class GradeSubmissionAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        submission_id = request.data.get('submission_id')
        grade = request.data.get('grade')
        feedback = request.data.get('feedback')
        professor_email = request.data.get('professor_email')

        if not all([submission_id, grade is not None, professor_email]):
            return Response({"error": "Données manquantes"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
            submission = Submission.objects.get(id=submission_id, assignment__professor=professor)

            if submission.status == 'graded':
                return Response({"error": "Cette soumission a déjà été notée"}, status=400)

            submission.grade = grade
            submission.feedback = feedback or ""
            submission.status = 'graded'

            from django.utils import timezone  
            from blockchain.utils import decrypt_private_key

            submission.graded_at = timezone.now()
            submission.save()

            # Blockchain integration for grading--------------------------hamza ----------------------
            try:
                if (professor.has_blockchain_profile and 
                    submission.blockchain_submission_id is not None):
                    from blockchain.interact import refund_user_if_needed
                    refund_user_if_needed(professor.wallet_address, min_balance=10.0) 
                    blockchain_result = blockchain_publish_result(
                        teacher_address=professor.wallet_address,
                        teacher_private_key=decrypt_private_key(professor.encrypted_private_key),
                        submission_id=submission.blockchain_submission_id,
                        grade=int(grade),
                        comment=feedback,
                        result_file_hash=hashlib.sha256(f"{grade}{feedback}".encode()).hexdigest()
                    )
                    
                    if blockchain_result['success']:
                        submission.blockchain_result_hash = blockchain_result['tx_hash']
                        submission.save()                    
            except Exception as e:
                logger.error(f"Blockchain grading failed: {e}")
            #--------------------------------hamza ----------------------------------
            return Response({
                "success": True,
                "message": "Note enregistrée avec succès"
            }, status=200)

        except User.DoesNotExist:
            return Response({"error": "Professeur non trouvé"}, status=404)
        except Submission.DoesNotExist:
            return Response({"error": "Soumission non trouvée ou ne vous appartient pas"}, status=404)
        



class ProfessorAnnouncementsAPIView(APIView):
    permission_classes = [AllowAny]  # À sécuriser plus tard avec auth si besoin

    def get(self, request):
        professor_email = request.GET.get('professor_email')
        if not professor_email:
            return Response({"error": "professor_email requis"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
            announcements = Announcement.objects.filter(created_by=professor).select_related('course').order_by('-created_at')
            serializer = AnnouncementSerializer(announcements, many=True)
            return Response(serializer.data)
        except User.DoesNotExist:
            return Response([], status=200)

class CreateAnnouncementAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = CreateAnnouncementSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        professor_email = request.data.get('professor_email')
        if not professor_email:
            return Response({"error": "professor_email requis"}, status=400)

        try:
            professor = User.objects.get(email=professor_email, role__rolename='professor')
        except User.DoesNotExist:
            return Response({"error": "Professeur non trouvé"}, status=400)

        course_id = serializer.validated_data.pop('course_id', None)
        course = None
        if course_id is not None:
            try:
                course = Course.objects.get(id=course_id, professor=professor)  # Sécurité : seul son cours
            except Course.DoesNotExist:
                return Response({"error": "Cours non trouvé ou ne vous appartient pas"}, status=400)

        announcement = Announcement.objects.create(
            created_by=professor,
            course=course,
            **serializer.validated_data
        )

        return Response({
            "success": True,
            "announcement": AnnouncementSerializer(announcement).data
        }, status=201)





#=====================================Student Views============================================#


# blocknet/views.py
class StudentAssignmentsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student_email = request.GET.get('student_email')
        if not student_email:
            return Response({"error": "student_email requis"}, status=400)

        try:
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)  # vide si pas étudiant

        # Récupérer tous les cours où l'étudiant est inscrit
        enrolled_courses = student.enrollments.all()
        assignments = Assignment.objects.filter(course__in=enrolled_courses).select_related('course')

        data = []
        for ass in assignments:
            data.append({
                "id": ass.id,
                "title": ass.title,
                "description": ass.description,
                "course_name": ass.course.course_name,
                "course_code": ass.course.course_code,
                "professor": ass.professor.fullname,
                "due_date": ass.due_date.isoformat(),
                "created_at": ass.created_at.isoformat(),
                "public_key": ass.public_key,  # Pour chiffrer la soumission
                "blockchain_transaction_hash": ass.blockchain_transaction_hash or "En attente",
            })

        return Response(data)
    





class StudentCoursesAPIView(APIView):
    permission_classes = [AllowAny]  # Comme les autres, pour le réseau ENSA

    def get(self, request):
        student_email = request.GET.get('student_email')
        
        if not student_email:
            return Response({"error": "student_email requis"}, status=400)

        try:
            # Vérifie que l'utilisateur existe et est un étudiant
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)  # Pas d'erreur, juste aucun cours

        # Récupère tous les cours où cet étudiant est inscrit
        enrolled_courses = CourseEnrollment.objects.filter(student=student).select_related('course')
        courses = [enrollment.course for enrollment in enrolled_courses]

        # Utilise ton serializer existant (parfait pour l'affichage des cards)
        serializer = CourseListSerializer(courses, many=True)
        return Response(serializer.data)
    




class StudentAssignmentsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student_email = request.query_params.get('student_email')

        if not student_email:
            return Response({"error": "student_email est requis"}, status=400)

        try:
            # Vérifie que l'utilisateur est bien un étudiant
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)  # Pas d'erreur, juste aucun devoir

        # Récupère les cours où l'étudiant est inscrit
        enrolled_courses = CourseEnrollment.objects.filter(student=student).values_list('course', flat=True)

        if not enrolled_courses:
            return Response([], status=200)

        # Tous les devoirs de ces cours
        assignments = Assignment.objects.filter(course__in=enrolled_courses).order_by('-created_at')

        # Passe l'email dans le contexte pour le serializer
        serializer = StudentAssignmentSerializer(
            assignments,
            many=True,
            context={'student_email': student_email}
        )

        return Response(serializer.data)
    


  

# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import IntegrityError
from django.utils import timezone
from .models import Submission, Assignment, User

class CreateSubmissionAPIView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        data = request.data

        assignment_id = data.get('assignment_id')
        encrypted_content = data.get('encrypted_content')
        student_id_hash = data.get('student_id_hash')
        student_email = data.get('student_email')

        if not all([assignment_id, encrypted_content, student_id_hash, student_email]):
            return Response({"error": "Tous les champs sont requis"}, status=400)

        try:
            student = User.objects.get(email=student_email, role__rolename='student')
            assignment = Assignment.objects.get(id=assignment_id)

            # Vérifier inscription au cours
            if not assignment.course.enrollments.filter(student=student).exists():
                return Response({"error": "Vous n'êtes pas inscrit à ce cours"}, status=400)

            # Vérifier date limite
            if assignment.due_date and timezone.now() > assignment.due_date:
                return Response({"error": "Date limite dépassée"}, status=400)

            submission = Submission.objects.create(
                assignment=assignment,
                student=student,
                encrypted_content=encrypted_content,
                student_id_hash=student_id_hash,
                status='submitted'
            )
            #-----------------------------hamza-----------------------------
            try:
                if (student.has_blockchain_profile and hasattr(assignment, 'blockchain_assignment_id') and assignment.blockchain_assignment_id is not None):
                    from blockchain.interact import refund_user_if_needed
                    refund_user_if_needed(student.wallet_address, min_balance=10.0)  
                    from blockchain.utils import decrypt_private_key
                    blockchain_result = blockchain_submit_assignment(
                        student_address=student.wallet_address,
                        student_private_key=decrypt_private_key(student.encrypted_private_key),
                        assignment_id=assignment.blockchain_assignment_id,
                        encrypted_answer=encrypted_content,
                        student_name=student.fullname,
                        submission_file_hash=hashlib.sha256(encrypted_content.encode()).hexdigest()
                    )
                    
                    if blockchain_result['success']:
                        submission.blockchain_transaction_hash = blockchain_result['tx_hash']
                        submission.blockchain_submission_id = blockchain_result['submission_id']
                        submission.save()
            except Exception as e:
                logger.error(f"Blockchain submission failed: {e}")
            #----------------------hamza----------------------------------

            return Response({
                "success": True,
                "message": "Soumission reçue avec succès !",
                "submission_id": submission.id
            }, status=201)

        except IntegrityError:
            return Response({"error": "Vous avez déjà soumis ce devoir"}, status=400)
        except User.DoesNotExist:
            return Response({"error": "Étudiant non trouvé"}, status=400)
        except Assignment.DoesNotExist:
            return Response({"error": "Devoir non trouvé"}, status=404)
        except Exception as e:
            return Response({"error": "Erreur serveur"}, status=500)


class StudentSubmissionsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student_email = request.GET.get('student_email')
        if not student_email:
            return Response({"error": "student_email requis"}, status=400)

        try:
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)

        submissions = Submission.objects.filter(student=student).select_related(
            'assignment', 'assignment__course', 'assignment__professor'
        ).order_by('-submitted_at')

        data = []
        for sub in submissions:
            data.append({
                "id": sub.id,
                "assignment_title": sub.assignment.title,
                "course_name": sub.assignment.course.course_name,
                "course_code": sub.assignment.course.course_code,
                "professor_name": sub.assignment.professor.fullname,
                "submitted_at": sub.submitted_at,
                "status": sub.status,
                "grade": str(sub.grade) if sub.grade is not None else None,
                "feedback": sub.feedback or "",
                "blockchain_transaction_hash": sub.blockchain_transaction_hash or ""
            })

        return Response(data)
    

# views.py

class StudentGradesAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student_email = request.GET.get('student_email')
        if not student_email:
            return Response({"error": "student_email requis"}, status=400)

        try:
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)

        # Soumissions notées seulement
        graded_submissions = Submission.objects.filter(
            student=student,
            status='graded'
        ).select_related(
            'assignment', 'assignment__course', 'assignment__professor'
        ).order_by('-graded_at')

        data = []
        for sub in graded_submissions:
            data.append({
                "id": sub.id,
                "assignment": sub.assignment.title,
                "course_name": sub.assignment.course.course_name,
                "professor_name": sub.assignment.professor.fullname,
                "grade": float(sub.grade) if sub.grade is not None else None,
                "feedback": sub.feedback or "",
                "graded_at": sub.graded_at,
                "blockchain_transaction_hash": sub.blockchain_transaction_hash or ""
            })

        return Response(data)


class StudentAnnouncementsAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        student_email = request.GET.get('student_email')
        if not student_email:
            return Response({"error": "student_email required"}, status=400)

        try:
            student = User.objects.get(email=student_email, role__rolename='student')
        except User.DoesNotExist:
            return Response([], status=200)

        # Cours de l'étudiant
        enrolled_courses = student.enrollments.values_list('course_id', flat=True)

        # Annonces : soit globales (course=None), soit dans un cours de l'étudiant
        announcements = Announcement.objects.filter(
            Q(course__id__in=enrolled_courses) | Q(course__isnull=True)
        ).select_related('course', 'created_by').order_by('-created_at')

        serializer = AnnouncementSerializer(announcements, many=True)
        return Response(serializer.data)



#-----------------------------hamza-------------------------
# ====================================
# BLOCKCHAIN INFO VIEW (FOR BOTH PROFESSOR & STUDENT)
# ====================================

class BlockchainInfoAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        user_email = request.GET.get('user_email')
        if not user_email:
            return Response({"error": "user_email required"}, status=400)
        
        try:
            user = User.objects.get(email=user_email)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)
        
        # Get blockchain network info
        blockchain_info = get_blockchain_info()
        
        # Get user's transactions
        transactions = []
        
        if user.role.rolename == 'professor':
            # Professor's assignments on blockchain
            assignments = Assignment.objects.filter(
                professor=user,
                blockchain_transaction_hash__isnull=False
            ).order_by('-created_at')[:10]
            
            for ass in assignments:
                transactions.append({
                    'id': ass.id,
                    'type': 'Assignment Created',
                    'tx_hash': ass.blockchain_transaction_hash,
                    'timestamp': ass.created_at.isoformat(),
                    'details': f"{ass.title} - {ass.course.course_name}",
                    'status': 'confirmed',
                    'blockchain_id': ass.blockchain_assignment_id
                })
            
            # Professor's graded submissions
            graded = Submission.objects.filter(
                assignment__professor=user,
                blockchain_result_hash__isnull=False
            ).order_by('-graded_at')[:10]
            
            for sub in graded:
                transactions.append({
                    'id': sub.id,
                    'type': 'Grade Published',
                    'tx_hash': sub.blockchain_result_hash,
                    'timestamp': sub.graded_at.isoformat() if sub.graded_at else '',
                    'details': f"{sub.student.fullname} - Grade: {sub.grade}/20",
                    'status': 'confirmed',
                    'blockchain_id': sub.blockchain_submission_id
                })
        
        elif user.role.rolename == 'student':
            # Student's submissions on blockchain
            submissions = Submission.objects.filter(
                student=user,
                blockchain_transaction_hash__isnull=False
            ).order_by('-submitted_at')[:10]
            
            for sub in submissions:
                transactions.append({
                    'id': sub.id,
                    'type': 'Submission Received',
                    'tx_hash': sub.blockchain_transaction_hash,
                    'timestamp': sub.submitted_at.isoformat(),
                    'details': f"{sub.assignment.title} - {sub.assignment.course.course_name}",
                    'status': 'confirmed',
                    'blockchain_id': sub.blockchain_submission_id
                })
                
                # If graded, add grade transaction
                if sub.blockchain_result_hash:
                    transactions.append({
                        'id': f"{sub.id}_grade",
                        'type': 'Grade Received',
                        'tx_hash': sub.blockchain_result_hash,
                        'timestamp': sub.graded_at.isoformat() if sub.graded_at else '',
                        'details': f"Grade: {sub.grade}/20 - {sub.assignment.title}",
                        'status': 'confirmed',
                        'blockchain_id': sub.blockchain_submission_id
                    })
        
        # Sort by timestamp (most recent first)
        transactions.sort(key=lambda x: x['timestamp'], reverse=True)
        
        return Response({
            'success': True,
            'blockchain_info': blockchain_info,
            'transactions': transactions,
            'user_address': user.wallet_address if user.has_blockchain_profile else None
        })


class TransactionDetailsAPIView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
        tx_hash = request.GET.get('tx_hash')
        if not tx_hash:
            return Response({"error": "tx_hash required"}, status=400)
        
        try:
            receipt = get_transaction_receipt(tx_hash)
            return Response(receipt)
        except Exception as e:
            return Response({"error": str(e)}, status=500)

#----------------------------hamza----------------------------



#===================================Admin Views============================================#



from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import AdminUserSerializer



class AdminListUsersAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # Exclure les admins + trier par nom
        users = User.objects.exclude(role__rolename='admin').order_by('lastname', 'firstname')

        serializer = AdminUserSerializer(users, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    


# views.py
from .serializers  import AdminCreateUserSerializer

class AdminCreateUserAPIView(APIView):
    permission_classes = [AllowAny]  # À sécuriser plus tard si besoin

    def post(self, request):
        serializer = AdminCreateUserSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Données invalides",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            user = serializer.save()

            return Response({
                "success": True,
                "message": "Utilisateur créé avec succès",
                "user": {
                    "id": user.id,
                    "fullname": user.fullname,
                    "email": user.email,
                    "role": user.role.rolename
                }
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({
                "success": False,
                "error": "Erreur serveur",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        


class AdminUpdateUserAPIView(APIView):
    permission_classes = [AllowAny]


    def patch(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

        serializer = AdminCreateUserSerializer(user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({
                "success": True,
                "message": "User updated successfully"
            })
        return Response({
            "error": "Invalid data",
            "details": serializer.errors
        }, status=400)
    


# views.py


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from .models import User

class AdminDeleteUserAPIView(APIView):
    permission_classes = [AllowAny]  # Change to IsAdminUser later

    def delete(self, request, user_id):
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({
                "success": False,
                "error": "User not found"
            }, status=status.HTTP_404_NOT_FOUND)

        # Optional: prevent deleting the last admin
        if user.role.rolename == 'admin' and User.objects.filter(role__rolename='admin').count() == 1:
            return Response({
                "success": False,
                "error": "Cannot delete the last admin account"
            }, status=status.HTTP_403_FORBIDDEN)

        user.delete()

        return Response({
            "success": True,
            "message": "User deleted successfully"
        }, status=status.HTTP_200_OK)
    




# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count
from .models import Course, User
from .serializers import AdminCourseSerializer  # NEW import

class AdminCourseManagementAPIView(APIView):
    """
    Unified API for Course Management (Admin Panel)
    Uses optimized queries with select_related and annotate
    """
    permission_classes = [AllowAny]

    def get(self, request):
        """
        GET /api/admin/courses/
        GET /api/admin/courses/?id=1
        GET /api/admin/courses/?search=python
        GET /api/admin/courses/?professor=2
        """
        course_id = request.query_params.get('id')

        # Single course detail
        if course_id:
            try:
                course = Course.objects.select_related(
                    'professor', 'professor__role'
                ).annotate(
                    enrollment_count=Count('enrollments'),
                    assignment_count=Count('assignments')
                ).get(id=course_id)
                
                serializer = AdminCourseSerializer(course)
                return Response({
                    "success": True,
                    "course": serializer.data
                }, status=status.HTTP_200_OK)
            except Course.DoesNotExist:
                return Response({
                    "success": False,
                    "error": "Course not found"
                }, status=status.HTTP_404_NOT_FOUND)

        # List with optimized queries - SINGLE database hit
        courses = Course.objects.select_related(
            'professor', 'professor__role'
        ).annotate(
            enrollment_count=Count('enrollments', distinct=True),
            assignment_count=Count('assignments', distinct=True)
        )

        # Filters
        search = request.query_params.get('search', '').strip()
        if search:
            courses = courses.filter(
                Q(course_code__icontains=search) |
                Q(course_name__icontains=search) |
                Q(description__icontains=search)
            )

        professor_id = request.query_params.get('professor')
        if professor_id:
            courses = courses.filter(professor_id=professor_id)

        assigned_filter = request.query_params.get('assigned')
        if assigned_filter == 'true':
            courses = courses.filter(professor__isnull=False)
        elif assigned_filter == 'false':
            courses = courses.filter(professor__isnull=True)

        # Sort
        sort_by = request.query_params.get('sort_by', '-created_at')
        courses = courses.order_by(sort_by)

        serializer = AdminCourseSerializer(courses, many=True)
        return Response({
            "success": True,
            "count": courses.count(),
            "courses": serializer.data
        }, status=status.HTTP_200_OK)

    def post(self, request):
        """Create new course"""
        serializer = AdminCourseSerializer(data=request.data)

        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        course = serializer.save()

        return Response({
            "success": True,
            "message": "Course created successfully",
            "course": AdminCourseSerializer(course).data
        }, status=status.HTTP_201_CREATED)

    def patch(self, request):
        """Update existing course"""
        course_id = request.data.get('id')

        if not course_id:
            return Response({
                "success": False,
                "error": "Course ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({
                "success": False,
                "error": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)

        serializer = AdminCourseSerializer(course, data=request.data, partial=True)

        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)

        updated_course = serializer.save()

        return Response({
            "success": True,
            "message": "Course updated successfully",
            "course": AdminCourseSerializer(updated_course).data
        }, status=status.HTTP_200_OK)

    def delete(self, request):
        """Delete course with safety checks"""
        course_id = request.data.get('id')

        if not course_id:
            return Response({
                "success": False,
                "error": "Course ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)

        try:
            course = Course.objects.annotate(
                enrollment_count=Count('enrollments'),
                assignment_count=Count('assignments')
            ).get(id=course_id)

            # Safety check
            if course.enrollment_count > 0 or course.assignment_count > 0:
                return Response({
                    "success": False,
                    "error": f"Cannot delete course with {course.enrollment_count} enrollments and {course.assignment_count} assignments"
                }, status=status.HTTP_400_BAD_REQUEST)

            course_data = AdminCourseSerializer(course).data
            course.delete()

            return Response({
                "success": True,
                "message": "Course deleted successfully",
                "deleted_course": course_data
            }, status=status.HTTP_200_OK)

        except Course.DoesNotExist:
            return Response({
                "success": False,
                "error": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)
        




# views.py

from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny
from django.db.models import Q, Count
from .models import CourseEnrollment, Course, User
from .serializers import EnrollmentSerializer, AdminEnrollmentSerializer

class AdminEnrollmentManagementAPIView(APIView):
    """
    Unified API for Student Enrollment Management
    - GET: List all enrollments with filters
    - POST: Enroll student in course
    - DELETE: Remove enrollment
    """
    permission_classes = [AllowAny]
    
    def get(self, request):
        """
        GET /api/admin/enrollments/
        GET /api/admin/enrollments/?student=1
        GET /api/admin/enrollments/?course=2
        GET /api/admin/enrollments/?search=john
        """
        enrollments = CourseEnrollment.objects.select_related(
            'student', 'student__role',
            'course', 'course__professor'
        ).order_by('-enrolled_date')
        
        # Search filter (student name, email, or course name/code)
        search = request.query_params.get('search', '').strip()
        if search:
            enrollments = enrollments.filter(
                Q(student__firstname__icontains=search) |
                Q(student__lastname__icontains=search) |
                Q(student__email__icontains=search) |
                Q(course__course_name__icontains=search) |
                Q(course__course_code__icontains=search)
            )
        
        # Filter by student
        student_id = request.query_params.get('student')
        if student_id:
            enrollments = enrollments.filter(student_id=student_id)
        
        # Filter by course
        course_id = request.query_params.get('course')
        if course_id:
            enrollments = enrollments.filter(course_id=course_id)
        
        # Filter by professor (students enrolled in courses taught by professor)
        professor_id = request.query_params.get('professor')
        if professor_id:
            enrollments = enrollments.filter(course__professor_id=professor_id)
        
        serializer = EnrollmentSerializer(enrollments, many=True)
        
        # Get statistics
        total_enrollments = enrollments.count()
        unique_students = enrollments.values('student').distinct().count()
        unique_courses = enrollments.values('course').distinct().count()
        
        return Response({
            "success": True,
            "count": total_enrollments,
            "stats": {
                "total_enrollments": total_enrollments,
                "unique_students": unique_students,
                "unique_courses": unique_courses
            },
            "enrollments": serializer.data
        }, status=status.HTTP_200_OK)
    
    def post(self, request):
        """
        POST /api/admin/enrollments/
        Body: {
            "student_id": 1,
            "course_id": 2
        }
        """
        serializer = AdminEnrollmentSerializer(data=request.data)
        
        if not serializer.is_valid():
            return Response({
                "success": False,
                "error": "Validation failed",
                "details": serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            enrollment = serializer.save()
            
            # Get full enrollment data for response
            full_enrollment = CourseEnrollment.objects.select_related(
                'student', 'course', 'course__professor'
            ).get(id=enrollment.id)
            
            return Response({
                "success": True,
                "message": "Student enrolled successfully",
                "enrollment": EnrollmentSerializer(full_enrollment).data
            }, status=status.HTTP_201_CREATED)
        
        except Exception as e:
            return Response({
                "success": False,
                "error": "Failed to create enrollment",
                "detail": str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    
    def delete(self, request):
        """
        DELETE /api/admin/enrollments/
        Body: {
            "id": 1
        }
        """
        enrollment_id = request.data.get('id')
        
        if not enrollment_id:
            return Response({
                "success": False,
                "error": "Enrollment ID is required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            enrollment = CourseEnrollment.objects.select_related(
                'student', 'course'
            ).get(id=enrollment_id)
            
            enrollment_data = EnrollmentSerializer(enrollment).data
            enrollment.delete()
            
            return Response({
                "success": True,
                "message": "Enrollment removed successfully",
                "deleted_enrollment": enrollment_data
            }, status=status.HTTP_200_OK)
        
        except CourseEnrollment.DoesNotExist:
            return Response({
                "success": False,
                "error": "Enrollment not found"
            }, status=status.HTTP_404_NOT_FOUND)


class BulkEnrollmentAPIView(APIView):
    """
    Bulk enrollment operations
    """
    permission_classes = [AllowAny]
    
    def post(self, request):
        """
        POST /api/admin/enrollments/bulk/
        Body: {
            "course_id": 1,
            "student_ids": [1, 2, 3, 4]
        }
        """
        course_id = request.data.get('course_id')
        student_ids = request.data.get('student_ids', [])
        
        if not course_id or not student_ids:
            return Response({
                "success": False,
                "error": "course_id and student_ids are required"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            course = Course.objects.get(id=course_id)
        except Course.DoesNotExist:
            return Response({
                "success": False,
                "error": "Course not found"
            }, status=status.HTTP_404_NOT_FOUND)
        
        # Validate all students exist
        students = User.objects.filter(id__in=student_ids, role__rolename='student')
        if students.count() != len(student_ids):
            return Response({
                "success": False,
                "error": "Some student IDs are invalid"
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Get already enrolled students
        existing_enrollments = CourseEnrollment.objects.filter(
            course=course,
            student__in=students
        ).values_list('student_id', flat=True)
        
        # Create new enrollments
        new_enrollments = []
        skipped = []
        
        for student in students:
            if student.id in existing_enrollments:
                skipped.append({
                    "student_id": student.id,
                    "student_name": student.fullname,
                    "reason": "Already enrolled"
                })
            else:
                enrollment = CourseEnrollment(student=student, course=course)
                new_enrollments.append(enrollment)
        
        # Bulk create
        created = CourseEnrollment.objects.bulk_create(new_enrollments)
        
        return Response({
            "success": True,
            "message": f"Enrolled {len(created)} students successfully",
            "created": len(created),
            "skipped": len(skipped),
            "skipped_details": skipped
        }, status=status.HTTP_201_CREATED)
    




# Relevant API (Add to views.py)

from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from django.utils import timezone
from .models import User, Course, CourseEnrollment, Assignment, Submission, Announcement
from .serializers import AnnouncementSerializer, ProfessorSubmissionSerializer

class AdminSystemOverviewAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        # User counts
        total_users = User.objects.count()
        students = User.objects.filter(role__rolename='student').count()
        professors = User.objects.filter(role__rolename='professor').count()
        admins = User.objects.filter(role__rolename='admin').count()
        active_users = User.objects.filter(is_active=True).count()

        # Course counts
        total_courses = Course.objects.count()
        assigned_courses = Course.objects.filter(professor__isnull=False).count()
        unassigned_courses = total_courses - assigned_courses
        total_enrollments = CourseEnrollment.objects.count()

        # Assignment counts
        total_assignments = Assignment.objects.count()
        overdue_assignments = Assignment.objects.filter(due_date__lt=timezone.now()).count()

        # Submission counts
        total_submissions = Submission.objects.count()
        graded_submissions = Submission.objects.filter(status='graded').count()

        # Recent announcements (last 5)
        recent_announcements = Announcement.objects.order_by('-created_at')[:5]
        ann_serializer = AnnouncementSerializer(recent_announcements, many=True)

        # Recent submissions (last 10)
        recent_submissions = Submission.objects.select_related(
            'student', 'assignment', 'assignment__course'
        ).order_by('-submitted_at')[:10]
        sub_serializer = ProfessorSubmissionSerializer(recent_submissions, many=True)

        return Response({
            "users": {
                "total": total_users,
                "students": students,
                "professors": professors,
                "admins": admins,
                "active": active_users
            },
            "courses": {
                "total": total_courses,
                "assigned": assigned_courses,
                "unassigned": unassigned_courses,
                "enrollments": total_enrollments
            },
            "assignments": {
                "total": total_assignments,
                "overdue": overdue_assignments
            },
            "submissions": {
                "total": total_submissions,
                "graded": graded_submissions,
                "pending": total_submissions - graded_submissions
            },
            "recent_announcements": ann_serializer.data,
            "recent_submissions": sub_serializer.data
        })

