from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, WorkerProfile

# Register your models here.


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display=['phone','full_name','role','area','is_active','created_at']
    list_filter=['role','is_active','is_staff']
    search_fields=['phone','full_name','email']
    ordering=['-created_at']

    fieldsets=(
        (None, {'fields': ('phone','password')}),
        ('Personal info',{'fields':('full_name','email','area')}),
        ('Role', {'fields': ('role',)}),
        ('Permissions', {'fields':('is_active','is_staff','is_superuser')}),
    )
    add_fieldsets=(
        (None,{
            'classes':('wide'),
            'fields':('phone','full_name','role','password1','password2'),
        }),
    )

@admin.register(WorkerProfile)
class WorkerProfileAdmin(admin.ModelAdmin):
    list_display=['user','is_verified','is_available','avg_rating','total_jobs']
    list_filter=['is_verified','is_available']
    search_fields=['user__full_name','user__phone']
    actions=['verify_workers']


    def verify_workers(self,request,queryset):
        queryset.update(is_verified=True)
    verify_workers.short_description='Mark selected workers as verified'
