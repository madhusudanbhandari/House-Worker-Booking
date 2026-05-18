from rest_framework import serializers
from .models import Review
from accounts.serializers import UserSerializer

class ReviewSerializer(serializers.ModelSerializer):
    customer_name=serializers.CharField(source='customer.full_name',read_only=True)
    worker_name=serializers.CharField(source='worker.full_name', read_only=True)
    

    class Meta:
        model=Review
        fields=['id','booking','customer_name','worker_name','rating','comment','created_at']


class CreateReviewSerializer(serializers.Serializer):
    booking_id=serializers.IntegerField()
    rating=serializers.IntegerField(min_value=1,max_value=5)
    comment=serializers.CharField(required=False,allow_blank=True)


    def validate_booking_id(self,value):
        from bookings.models import Booking

        try:
            booking=Booking.objects.get(id=value)
        except Booking.DoesNotExist:
            raise serializers.ValidationError('Booking not found')
        
        if booking.status!=Booking.COMPLETED:
            raise serializers.ValidationError('You can only review completed booking.')
        
        if hasattr(booking,'review'):
            raise serializers.ValidationError('You have already reviewed this booking')
        
        return value