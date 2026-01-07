# blocknet/serializers.py
from rest_framework import serializers
from .models import Course , Assignment




class CourseListSerializer(serializers.ModelSerializer):
    enrollments = serializers.SerializerMethodField()
    assignments = serializers.SerializerMethodField()
    professor_fullname = serializers.CharField(source='professor.fullname', read_only=True)  

    class Meta:
        model = Course
        fields = [
            'id',
            'course_code',
            'course_name',
            'description',
            'professor_fullname', 
            'enrollments',
            'assignments',
        ]

    def get_enrollments(self, obj):
        return obj.enrollments.count()

    def get_assignments(self, obj):
        return obj.assignments.count()


# blocknet/serializers.py
from rest_framework import serializers

class AssignmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    submissions_count = serializers.IntegerField(read_only=True)
    total_students = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'due_date', 'created_at',
            'course_name', 'course_code', 'submissions_count', 'total_students',
            'blockchain_transaction_hash'
        ]

    def get_total_students(self, obj):
        return obj.course.enrollments.count()
    




class CreateAssignmentSerializer(serializers.ModelSerializer):
    professor_email = serializers.EmailField(write_only=True)
    course_id = serializers.IntegerField(write_only=True)

    class Meta:
        model = Assignment
        fields = [
            'id', 'title', 'description', 'course_id', 'due_date',
            'public_key', 'professor_email', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']

    def validate(self, data):
        # Custom validation for extra safety
        professor_email = data.get('professor_email')
        course_id = data.get('course_id')

        if not professor_email or not course_id:
            raise serializers.ValidationError("professor_email and course_id are required.")

        try:
            from .models import User, Course
            professor = User.objects.get(email=professor_email, role__rolename='professor')
            course = Course.objects.get(id=course_id, professor=professor)
        except User.DoesNotExist:
            raise serializers.ValidationError({"professor_email": "No professor found with this email."})
        except Course.DoesNotExist:
            raise serializers.ValidationError({"course_id": "Course not found or does not belong to this professor."})

        # Attach to data for create()
        data['professor'] = professor
        data['course'] = course
        return data

    def create(self, validated_data):
        # Pop the objects we attached in validate()
        professor = validated_data.pop('professor')
        course = validated_data.pop('course')

        assignment = Assignment.objects.create(
            title=validated_data['title'],
            description=validated_data['description'],
            course=course,
            professor=professor,
            public_key=validated_data['public_key'],
            private_key_hash="NEVER_STORED",
            due_date=validated_data['due_date'],
            blockchain_transaction_hash=None  # Will be filled by blockchain teammate
        )
        return assignment
    


# blocknet/serializers.py

from rest_framework import serializers
from .models import Submission

class ProfessorSubmissionSerializer(serializers.ModelSerializer):
    student_fullname = serializers.CharField(source='student.fullname', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    assignment_title = serializers.CharField(source='assignment.title', read_only=True)
    course_name = serializers.CharField(source='assignment.course.course_name', read_only=True)
    course_code = serializers.CharField(source='assignment.course.course_code', read_only=True)

    class Meta:
        model = Submission
        fields = [
            'id',
            'student_fullname',
            'student_email',
            'assignment_title',
            'course_name',
            'course_code',
            'encrypted_content',
            'student_id_hash',
            'submitted_at',
            'status',
            'grade',
            'feedback',
            'blockchain_transaction_hash'
        ]


# blocknet/serializers.py

from rest_framework import serializers
from .models import Assignment, Submission, User

class StudentAssignmentSerializer(serializers.ModelSerializer):
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    professor_fullname = serializers.CharField(source='professor.fullname', read_only=True)
    description = serializers.CharField(read_only=True)
    public_key = serializers.CharField(read_only=True)
    
    # Statut : l'étudiant a-t-il déjà soumis ?
    has_submitted = serializers.SerializerMethodField()
    
    # Est-ce overdue ?
    is_overdue = serializers.SerializerMethodField()

    class Meta:
        model = Assignment
        fields = [
            'id',
            'title',
            'description',
            'course_name',
            'course_code',
            'professor_fullname',
            'due_date',
            'created_at',
            'public_key',
            'blockchain_transaction_hash',
            'has_submitted',
            'is_overdue',
        ]

    def get_has_submitted(self, obj):
        # Récupère l'email de l'étudiant depuis le contexte (passé par la view)
        student_email = self.context.get('student_email')
        if not student_email:
            return False
        return Submission.objects.filter(
            assignment=obj,
            student__email=student_email
        ).exists()

    def get_is_overdue(self, obj):
        from django.utils import timezone
        return timezone.now() > obj.due_date
    





from rest_framework import serializers
from .models import Announcement

class AnnouncementSerializer(serializers.ModelSerializer):
    created_by_name = serializers.CharField(source='created_by.fullname', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True, allow_null=True)

    class Meta:
        model = Announcement
        fields = [
            'id',
            'title',
            'content',
            'created_by',
            'created_by_name',
            'created_at',
            'course',
            'course_name',
            'blockchain_transaction_hash',
        ]
        read_only_fields = ['created_by', 'created_at', 'blockchain_transaction_hash']

class CreateAnnouncementSerializer(serializers.ModelSerializer):
    course_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Announcement
        fields = ['title', 'content', 'course_id']

    def validate(self, data):
        # Le created_by sera ajouté dans la view (sécurité)
        course_id = data.get('course_id')
        if course_id is not None:
            try:
                from .models import Course
                course = Course.objects.get(id=course_id)
                # Optionnel : vérifier que le professeur enseigne ce cours
                # if course.professor != request.user:
                #     raise serializers.ValidationError("Vous n'enseignez pas ce cours.")
            except Course.DoesNotExist:
                raise serializers.ValidationError("Cours non trouvé.")
        return data
    




#==================================admin serializers==================================#

class AdminUserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.rolename', read_only=True)
    status = serializers.SerializerMethodField()
    created_at = serializers.DateTimeField(source='date_joined', read_only=True, format='%Y-%m-%d')

    def get_status(self, obj):
        return 'active' if obj.is_active else 'inactive'

    class Meta:
        model = User
        fields = [
            'id',
            'firstname',
            'lastname',
            'email',
            'role',
            'status',
            'created_at',
            'wallet_address'
        ]
        read_only_fields = ['id', 'created_at']





from .models import User, Role
from django.contrib.auth.hashers import make_password

# serializers.py

from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Role
# serializers.py

from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Role

# serializers.py

from rest_framework import serializers
from django.contrib.auth.hashers import make_password
from .models import User, Role

class AdminCreateUserSerializer(serializers.ModelSerializer):
    role = serializers.SlugRelatedField(
        slug_field='rolename',
        queryset=Role.objects.all(),
        error_messages={
            'does_not_exist': "Role '{value}' does not exist.",
            'invalid': "Invalid role."
        }
    )

    class Meta:
        model = User
        fields = ['firstname', 'lastname', 'email', 'password', 'role', 'is_active']  # ← AJOUTE 'is_active' ICI
        extra_kwargs = {
            'password': {'write_only': True, 'min_length': 8, 'required': True, 'allow_blank': False}
        }

    def validate_email(self, value):
        email = value.strip().lower()
        
        # Get current instance if we're updating (not creating)
        instance = getattr(self, 'instance', None)
        
        # If updating and email didn't change → allow it
        if instance and instance.email == email:
            return email
        
        # Otherwise, check uniqueness
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError("This email is already in use.")
        
        return email

    def validate_role(self, value):
        # SlugRelatedField already validates existence, but we can add extra check if needed
        if value.rolename not in ['student', 'professor']:
            raise serializers.ValidationError("Role must be 'student' or 'professor'.")
        return value

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User.objects.create(
            firstname=validated_data['firstname'].strip(),
            lastname=validated_data['lastname'].strip(),
            email=validated_data['email'],
            role=validated_data['role'],
            is_active=True
        )
        user.set_password(password)
        user.save()
        return user

    def update(self, instance, validated_data):
        # Handle password only if provided
        if 'password' in validated_data:
            password = validated_data.pop('password')
            instance.set_password(password)

        instance.firstname = validated_data.get('firstname', instance.firstname).strip()
        instance.lastname = validated_data.get('lastname', instance.lastname).strip()
        instance.email = validated_data.get('email', instance.email)
        instance.role = validated_data.get('role', instance.role)
        
        # ← ADD THIS LINE
        instance.is_active = validated_data.get('is_active', instance.is_active)

        instance.save()
        return instance
    




class AdminCourseSerializer(serializers.ModelSerializer):
    """
    Enhanced serializer for admin course management
    Includes validation, professor details, and counts
    """
    professor_name = serializers.SerializerMethodField(read_only=True)
    professor_email = serializers.SerializerMethodField(read_only=True)
    enrollment_count = serializers.SerializerMethodField(read_only=True)
    assignment_count = serializers.SerializerMethodField(read_only=True)
    
    # For write operations - accept professor ID
    professor_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)

    class Meta:
        model = Course
        fields = [
            'id',
            'course_code',
            'course_name',
            'description',
            'professor',
            'professor_id',  # Write-only
            'professor_name',  # Read-only
            'professor_email',  # Read-only
            'enrollment_count',
            'assignment_count',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at', 'professor']
        extra_kwargs = {
            'course_code': {'required': True},
            'course_name': {'required': True},
        }

    def get_professor_name(self, obj):
        return obj.professor.fullname if obj.professor else None

    def get_professor_email(self, obj):
        return obj.professor.email if obj.professor else None

    def get_enrollment_count(self, obj):
        if hasattr(obj, 'enrollment_count'):
            return obj.enrollment_count
        return obj.enrollments.count()

    def get_assignment_count(self, obj):
        if hasattr(obj, 'assignment_count'):
            return obj.assignment_count
        return obj.assignments.count()

    def validate_course_code(self, value):
        """Ensure course code is uppercase and unique"""
        value = value.upper().strip()

        if self.instance and self.instance.course_code == value:
            return value

        if Course.objects.filter(course_code=value).exists():
            raise serializers.ValidationError("Course code already exists")

        return value

    def validate_professor_id(self, value):
        """Validate professor exists and has correct role"""
        # ✅ FIX: Allow None, 0, or empty string for unassigning
        if value is None or value == 0 or value == '':
            return None
        
        try:
            professor = User.objects.get(id=value)
            if professor.role.rolename != 'professor':
                raise serializers.ValidationError("Selected user is not a professor")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Professor not found")

    def create(self, validated_data):
        """Handle course creation with professor assignment"""
        professor_id = validated_data.pop('professor_id', None)
        
        professor = None
        if professor_id:
            professor = User.objects.get(id=professor_id)
        
        course = Course.objects.create(
            course_code=validated_data['course_code'],
            course_name=validated_data['course_name'],
            description=validated_data.get('description', ''),
            professor=professor
        )
        
        return course

    def update(self, instance, validated_data):
        """Handle course updates including professor reassignment"""
        professor_id = validated_data.pop('professor_id', None)
        
        # ✅ FIX: Handle None, 0, or empty string for unassigning
        if 'professor_id' in self.initial_data:
            if professor_id is None or professor_id == 0 or professor_id == '':
                instance.professor = None
            else:
                try:
                    instance.professor = User.objects.get(id=professor_id)
                except User.DoesNotExist:
                    raise serializers.ValidationError({"professor_id": "Professor not found"})
        
        # Update other fields
        instance.course_code = validated_data.get('course_code', instance.course_code)
        instance.course_name = validated_data.get('course_name', instance.course_name)
        instance.description = validated_data.get('description', instance.description)
        
        instance.save()
        return instance
    


# serializers.py

from rest_framework import serializers
from .models import CourseEnrollment, Course, User
from django.utils import timezone

class EnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for displaying enrollment information
    """
    student_name = serializers.CharField(source='student.fullname', read_only=True)
    student_email = serializers.CharField(source='student.email', read_only=True)
    course_code = serializers.CharField(source='course.course_code', read_only=True)
    course_name = serializers.CharField(source='course.course_name', read_only=True)
    professor_name = serializers.SerializerMethodField(read_only=True)
    enrolled_date = serializers.DateTimeField(read_only=True, format='%Y-%m-%d %H:%M')
    
    class Meta:
        model = CourseEnrollment
        fields = [
            'id',
            'student',
            'student_name',
            'student_email',
            'course',
            'course_code',
            'course_name',
            'professor_name',
            'enrolled_date'
        ]
        read_only_fields = ['id', 'enrolled_date']
    
    def get_professor_name(self, obj):
        return obj.course.professor.fullname if obj.course.professor else "Unassigned"


class AdminEnrollmentSerializer(serializers.ModelSerializer):
    """
    Serializer for creating/managing enrollments
    """
    student_id = serializers.IntegerField(write_only=True)
    course_id = serializers.IntegerField(write_only=True)
    
    class Meta:
        model = CourseEnrollment
        fields = ['id', 'student_id', 'course_id', 'enrolled_date']
        read_only_fields = ['id', 'enrolled_date']
    
    def validate_student_id(self, value):
        """Validate student exists and has correct role"""
        try:
            student = User.objects.get(id=value)
            if student.role.rolename != 'student':
                raise serializers.ValidationError("Selected user is not a student")
            return value
        except User.DoesNotExist:
            raise serializers.ValidationError("Student not found")
    
    def validate_course_id(self, value):
        """Validate course exists"""
        try:
            Course.objects.get(id=value)
            return value
        except Course.DoesNotExist:
            raise serializers.ValidationError("Course not found")
    
    def validate(self, data):
        """Check if enrollment already exists"""
        student_id = data.get('student_id')
        course_id = data.get('course_id')
        
        # If updating, allow the same combination
        if self.instance:
            return data
        
        # Check for duplicate enrollment
        if CourseEnrollment.objects.filter(student_id=student_id, course_id=course_id).exists():
            raise serializers.ValidationError("Student is already enrolled in this course")
        
        return data
    
    def create(self, validated_data):
        """Create enrollment"""
        student_id = validated_data.pop('student_id')
        course_id = validated_data.pop('course_id')
        
        student = User.objects.get(id=student_id)
        course = Course.objects.get(id=course_id)
        
        enrollment = CourseEnrollment.objects.create(
            student=student,
            course=course
        )
        
        return enrollment
    
