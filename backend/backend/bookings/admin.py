from django.contrib import admin
from .models import Booking,BookingStatusHistory
# Register your models here

class StatusHistoryInline(admin.TabularInline):
    model=BookingStatusHistory
    extra=0
    readonly_fields=['old_status','new_status','changed_by','changed_at','note']

@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = [
        'id', 'customer', 'worker', 'service',
        'status', 'total_price', 'scheduled_at', 'created_at'
    ]
    list_filter   = ['status', 'service__category', 'created_at']
    search_fields = [
        'customer__full_name', 'worker__full_name',
        'service__name', 'area'
    ]
    readonly_fields = ['created_at', 'updated_at']
    inlines         = [StatusHistoryInline]


@admin.register(BookingStatusHistory)
class BookingStatusHistoryAdmin(admin.ModelAdmin):
    list_display  = ['booking', 'old_status', 'new_status', 'changed_by', 'changed_at']
    list_filter   = ['new_status']
    readonly_fields = ['changed_at']


