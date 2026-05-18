from rest_framework import serializers
from django.utils import timezone
from .models import Booking, BookingStatusHistory
from accounts.serializers import UserSerializer
from services.serializers import ServiceSerializer
from accounts.models import User, WorkerProfile
from services.models import WorkerService

class BookingStatusHistorySerializer(serializers.ModelSerializer):
    changed_by_name=serializers.CharField(
        source='changed_by.full_name',
        read_only=True
    )

    class Meta:
        model=BookingStatusHistory
        fields=['id', 'old_status', 'new_status', 'changed_by_name', 'note', 'changed_at']


class BookingSerializer(serializers.ModelSerializer):
    customer=UserSerializer(read_only=True)
    worker=UserSerializer(read_only=True)
    service=ServiceSerializer(read_only=True)
    status_history=BookingStatusHistorySerializer(many=True,read_only=True)
    status_display=serializers.CharField(source='get_status_display',read_only=True)

    class Meta:
        model=Booking
        fields = [
            'id', 'customer', 'worker', 'service',
            'address', 'area', 'scheduled_at', 'note',
            'total_price', 'status', 'status_display',
            'rejection_reason', 'cancellation_reason',
            'created_at', 'updated_at', 'status_history'
        ]


class CreateBookingSerializer(serializers.ModelSerializer):
    worker_id=serializers.IntegerField()
    service_id=serializers.IntegerField()
    address=serializers.CharField()
    area=serializers.CharField()
    scheduled_at=serializers.DateTimeField()
    note=serializers.CharField(required=False,allow_blank=True)


    def validate_schedule_at(self,value):
        if value<timezone.now():
            raise serializers.ValidationError('Scheduled time cannot be past.')
        return value
    
    def validate(self,data):
        try:
            worker=User.objects.get(id=data['Worker_id'],role='Worker')
        except User.DoesNotExist:
            raise serializers.ValidationError('Worker not found')
        

        try:
            profile = worker.worker_profile
            if not profile.is_verified:
                raise serializers.ValidationError("This worker is not verified yet.")
            if not profile.is_available:
                raise serializers.ValidationError("This worker is not available.")
        except WorkerProfile.DoesNotExist:
            raise serializers.ValidationError("Worker profile not found.")
    
        try:
            worker_service=WorkerService.objects.get(
                worker=worker,
                service_id=data['service_id'],
                is_active=True
            )
        except WorkerService.DoesNotExist:
            raise serializers.ValidationError('This worker does not offer this service')
        
        data['worker']=worker
        data['worker_service']=worker_service
        return data
    

class UpdateBookingStatusSerializer(serializers.Serializer):
    status=serializers.ChoiceField(choices=Booking.STATUS_CHOICES)
    note=serializers.CharField(required=False,allow_blank=True)

