from rest_framework import serializers
from .models import Category, Service,WorkerService,WorkerAvailability
from accounts.serializers import UserSerializer

class CategorySerializer(serializers.ModelSerializer):
    service_count=serializers.SerializerMethodField()

    class Meta:
        model=Category
        fields=['id','name','description','is_active','service_count']

    def get_service_count(self,obj):
        return obj.services.filter(is_active=True).count()
    


class ServiceSerializer(serializers.ModelSerializer):
    category_name=serializers.CharField(source='Category.name',read_only=True)


    class Meta:
        model=Service
        fields= fields = [
            'id', 'category', 'category_name', 'name',
            'description', 'base_price', 'duration_hours', 'is_active'
        ]

class WorkerAvailabilitySerializer(serializers.ModelSerializer):
    day_name=serializers.CharField(source='get_day_of_week_display',read_only=True)

    class Meta:
        model=WorkerAvailability
        field= ['id', 'day_of_week', 'day_name', 'start_time', 'end_time', 'is_active']



class WorkerServiceSerializer(serializers.ModelSerializer):
    service=ServiceSerializer(read_only=True)
    service_id=serializers.PrimaryKeyRelatedField(
        queryset=Service.objects.all(),
        source='service',
        write_only=True
    )

    class Meta:
        model=WorkerService
        fields = ['id', 'service', 'service_id', 'my_price', 'my_duration', 'is_active']


class WorkerPublicProfileSerializer(serializers.ModelSerializer):
   
    full_name        = serializers.CharField(source='user.full_name')
    phone            = serializers.CharField(source='user.phone')
    area             = serializers.CharField(source='user.area')
    services_offered = WorkerServiceSerializer(
        source='user.worker_services',
        many=True,      
        read_only=True
    )
    availability     = WorkerAvailabilitySerializer(
        source='user.availability',
        many=True,
        read_only=True
    )

    class Meta:
        model  = __import__('accounts.models', fromlist=['WorkerProfile']).WorkerProfile
        fields = [
            'id', 'full_name', 'phone', 'area', 'avatar',
            'bio', 'experience_years', 'is_verified', 'is_available',
            'avg_rating', 'total_jobs',
            'services_offered', 'availability'
        ]