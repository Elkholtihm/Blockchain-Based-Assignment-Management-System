from django.db import models
from django.contrib.auth.hashers import make_password, check_password
from django.utils import timezone
from django.core.exceptions import ValidationError

# ============================================
# 1. USER MANAGEMENT
# ============================================

class Role(models.Model):
    rolename = models.CharField(max_length=50, unique=True)  # student, professor, admin
    
    def __str__(self):
        return self.rolename

class User(models.Model):
    # Basic info
    firstname = models.CharField(max_length=255)
    lastname = models.CharField(max_length=255)
    email = models.EmailField(unique=True)
    password = models.CharField(max_length=255)
    role = models.ForeignKey(Role, on_delete=models.CASCADE)
    
    # Blockchain info -------- hamza --------
    wallet_address = models.CharField(max_length=42, blank=True, null=True)  # Already exists!
    encrypted_private_key = models.TextField(blank=True, null=True)  # Add this
    blockchain_profile_created_at = models.DateTimeField(null=True, blank=True)  # Add this
    # -------- hamza --------

    is_active = models.BooleanField(default=True)
    date_joined = models.DateTimeField(auto_now_add=True)
    
    def set_password(self, raw_password):
        self.password = make_password(raw_password)
    
    def check_password(self, raw_password):
        return check_password(raw_password, self.password)
    
    @property
    def fullname(self):
        return f"{self.firstname} {self.lastname}"
    
    @property
    def has_blockchain_profile(self):
        """Check if user has blockchain credentials"""
        return bool(self.wallet_address and self.encrypted_private_key)
    
    def __str__(self):
        return f"{self.fullname} ({self.email})"

# ============================================
# 2. COURSE & CLASS MANAGEMENT
# ============================================

class Course(models.Model):
    course_name = models.CharField(max_length=255)
    course_code = models.CharField(max_length=50, unique=True)
    description = models.TextField(blank=True)
    professor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='courses_taught',
        limit_choices_to={'role__rolename': 'professor'},
        null=True,
        blank=True
        )
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.course_code} - {self.course_name}"

class CourseEnrollment(models.Model):
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='enrollments',
        limit_choices_to={'role__rolename': 'student'}
    )
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    enrolled_date = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        unique_together = ['student', 'course']
    
    def __str__(self):
        return f"{self.student.fullname} enrolled in {self.course.course_name}"

# ============================================
# 3. ASSIGNMENT MANAGEMENT
# ============================================

class Assignment(models.Model):
    title = models.CharField(max_length=255)
    description = models.TextField()
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='assignments')
    professor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assignments_created',
        limit_choices_to={'role__rolename': 'professor'}
    )
    
    public_key = models.TextField()
    private_key_hash = models.CharField(max_length=255)
    
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateTimeField()

    #-------------------hamza----------------
    blockchain_transaction_hash = models.CharField(max_length=66, blank=True, null=True)
    blockchain_assignment_id = models.IntegerField(blank=True, null=True)  
    
    #blockchain_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    #------------------hamza----------------

    def __str__(self):
        return f"{self.title} - {self.course.course_name}"
    
    @property
    def is_overdue(self):
        return timezone.now() > self.due_date

# ============================================
# 4. SUBMISSION MANAGEMENT
# ============================================

class Submission(models.Model):
    STATUS_CHOICES = [
        ('submitted', 'Submitted'),
        ('graded', 'Graded'),
    ]
    
    assignment = models.ForeignKey(Assignment, on_delete=models.CASCADE, related_name='submissions')
    student = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='submissions',
        limit_choices_to={'role__rolename': 'student'}
    )
    
    encrypted_content = models.TextField()
    student_id_hash = models.CharField(max_length=255)
    
    #blockchain_transaction_hash = models.CharField(max_length=255, blank=True, null=True)  # Nullable pour pending
    
    submitted_at = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='submitted')
    
    grade = models.DecimalField(max_digits=5, decimal_places=2, null=True, blank=True)
    max_grade = models.DecimalField(max_digits=5, decimal_places=2, default=20)
    feedback = models.TextField(blank=True, null=True)
    graded_at = models.DateTimeField(null=True, blank=True)

    #-------------------hamza----------------
    blockchain_transaction_hash = models.CharField(max_length=255, blank=True, null=True) 
    blockchain_submission_id = models.IntegerField(blank=True, null=True)  
    blockchain_result_hash = models.CharField(max_length=66, blank=True, null=True)  
    #------------------hamza----------------

    class Meta:
        unique_together = ['assignment', 'student']
    
    def clean(self):
        if self.assignment.is_overdue and not self.pk:  # Seulement pour nouvelles soumissions
            raise ValidationError("Cannot submit after due date.")
    
    def __str__(self):
        return f"{self.student.fullname} - {self.assignment.title}"

# ============================================
# 5. ANNOUNCEMENTS
# ============================================

class Announcement(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='announcements',
        limit_choices_to={'role__rolename__in': ['professor', 'admin']}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Si null → annonce globale (visible par tous)
    # Sinon → visible uniquement par les étudiants du cours
    course = models.ForeignKey(
        Course, 
        on_delete=models.CASCADE, 
        null=True, 
        blank=True, 
        related_name='announcements'
    )
    
    # Pour la traçabilité blockchain (à remplir par ton coéquipier plus tard)
    blockchain_transaction_hash = models.CharField(max_length=255, blank=True, null=True)
    
    class Meta:
        ordering = ['-created_at']  # Les plus récentes en premier
    
    def __str__(self):
        course_name = self.course.course_name if self.course else "Globale"
        return f"{self.title} ({course_name}) - {self.created_by.fullname}"\
        
