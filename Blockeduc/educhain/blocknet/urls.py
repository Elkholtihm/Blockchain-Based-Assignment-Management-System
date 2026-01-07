# blocknet/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('auth/login/', views.login_view, name='login'),

    # Professor
    path('courses/', views.ProfessorCoursesAPIView.as_view(), name='professor-courses'),
    path('assignments/', views.ProfessorAssignmentsAPIView.as_view(), name='professor-assignments'),
    path('assignments/create/', views.CreateAssignmentAPIView.as_view(), name='create-assignment'),
    path('professor/submissions/', views.ProfessorSubmissionsAPIView.as_view(), name='professor-submissions'),
    path('professor/pending-submissions/', views.ProfessorPendingSubmissionsAPIView.as_view(), name='professor-pending-submissions'),
    
    # Notation
    path('professor/grade-submission/', views.GradeSubmissionAPIView.as_view(), name='grade-submission'),

    path('professor/announcements/', views.ProfessorAnnouncementsAPIView.as_view()),
    path('announcements/create/', views.CreateAnnouncementAPIView.as_view()),

    # Student
    path('student/courses/', views.StudentCoursesAPIView.as_view(), name='student-courses'),
    path('student/assignments/', views.StudentAssignmentsAPIView.as_view(), name='student-assignments'),
    path('student/submissions/', views.StudentSubmissionsAPIView.as_view()),
    path('student/create/submissions/', views.CreateSubmissionAPIView.as_view(), name='student-create-submission'),
    path('student/grades/', views.StudentGradesAPIView.as_view(), name='student-grades'),

    path('student/announcements/', views.StudentAnnouncementsAPIView.as_view()),

    # Blockchain info----------------------hamza----------------------------------
    path('blockchain/info/', views.BlockchainInfoAPIView.as_view(), name='blockchain-info'),
    path('blockchain/transaction/', views.TransactionDetailsAPIView.as_view(), name='transaction-details'),
    #-------------------------------------hamza--------------------------------------

    #------------------------------------------------------admin
    path('admin/users/', views.AdminListUsersAPIView.as_view(), name='admin-users'),
    path('admin/create-users/', views.AdminCreateUserAPIView.as_view(), name='admin-create-user'),
    path('admin/update-user/<int:user_id>/', views.AdminUpdateUserAPIView.as_view(), name='admin-update-user'),
    path('admin/delete-user/<int:user_id>/', views.AdminDeleteUserAPIView.as_view(), name='admin-delete-user'),
    path('admin/courses/', views.AdminCourseManagementAPIView.as_view(), name='admin-courses'),

    path('admin/enrollments/', views.AdminEnrollmentManagementAPIView.as_view(), name='admin-enrollments'),
    path('admin/enrollments/bulk/', views.BulkEnrollmentAPIView.as_view(), name='bulk-enrollments'),
    path('admin/system-overview/', views.AdminSystemOverviewAPIView.as_view(), name='admin-system-overview'),
]


