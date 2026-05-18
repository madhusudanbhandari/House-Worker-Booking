from django.contrib import admin
from .models import Review

# Register your models here.

@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display=['customer','worker','rating','booking','created_at']
    list_filter=['rating']
    search_fields=['customer__full_name','worker__full_name']
    readonly_fields=['created_at']