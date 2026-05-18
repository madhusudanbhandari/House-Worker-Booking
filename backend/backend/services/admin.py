from django.contrib import admin
from .models import Category, Service,WorkerService,WorkerAvailability
# Register your models here.

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display=['name','is_active','created_at']
    list_filter=['is_active']
    search_fields=['name']



@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display=['name','category','base_price','duration_hours','is_active']
    list_filter=['category','is_active']
    search_fields=['name','category__name']


@admin.register(WorkerService)
class WorkerServiceAdmin(admin.ModelAdmin):
    list_display=['worker','service','my_price','is_active']
    list_filter=['is_active','service__category']
    search_fields=['worker__full_name','service__name']


@admin.register(WorkerAvailability)
class WorkerAvailabilityAdmin(admin.ModelAdmin):
    list_display  = ['worker', 'day_of_week', 'start_time', 'end_time', 'is_active']
    list_filter   = ['day_of_week', 'is_active']
    search_fields = ['worker__full_name']