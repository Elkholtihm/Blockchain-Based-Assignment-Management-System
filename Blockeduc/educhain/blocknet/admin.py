
from django.contrib import admin
from .models import Role, User, Course, CourseEnrollment, Assignment, Submission, Announcement

@admin.register(Role)
class RoleAdmin(admin.ModelAdmin):
    list_display = ['id', 'rolename']

#------------------------hamza---------------------
@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ['id', 'get_fullname', 'email', 'role', 'wallet_address', 'has_blockchain_profile']
    list_filter = ['role']
    search_fields = ['firstname', 'lastname', 'email', 'wallet_address']
    readonly_fields = ['encrypted_private_key']
    
    def get_fullname(self, obj):
        return obj.fullname
    get_fullname.short_description = 'Full Name'
    
    def has_blockchain_profile(self, obj):
        return obj.has_blockchain_profile
    has_blockchain_profile.boolean = True
    has_blockchain_profile.short_description = 'Has Blockchain'
#-----------------------hamza----------------------

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ['id', 'course_code', 'course_name', 'professor']
    list_filter = ['professor']
    search_fields = ['course_name', 'course_code']

@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'course', 'enrolled_date']
    list_filter = ['course', 'enrolled_date']
    search_fields = ['student__firstname', 'student__lastname', 'course__course_name']

@admin.register(Assignment)
class AssignmentAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'course', 'professor', 'due_date', 'created_at']
    list_filter = ['course', 'professor', 'due_date']
    search_fields = ['title', 'description']

@admin.register(Submission)
class SubmissionAdmin(admin.ModelAdmin):
    list_display = ['id', 'student', 'assignment', 'status', 'grade', 'submitted_at']
    list_filter = ['status', 'assignment', 'submitted_at']
    search_fields = ['student__firstname', 'student__lastname', 'assignment__title']

@admin.register(Announcement)
class AnnouncementAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'created_by', 'course', 'created_at']
    list_filter = ['course', 'created_at']
    search_fields = ['title', 'content']
