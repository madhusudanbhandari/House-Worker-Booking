from rest_framework import serializers
from django.contrib.auth import authenticate
from .models import User,WorkerProfile


class RegisterSerializer(serializers.ModelSerializer):
    password=serializers.CharField(write_only=True, min_length=6)


    class Meta:
        model=User
        fields=['phone','full_name','email','role','area','password']

    def validate_phone(self,value):
        if not value.isdigit():
            raise serializers.ValidationError("Phone must contain only digits.")
        if len(value) != 10:
            raise serializers.ValidationError("Phone must be exactly 10 digits.")
        if User.objects.filter(phone=value).exists():
            raise serializers.ValidationError("Phone number already in use.")
        return value
    
    def validate_role(self,value):
        if value==User.ADMIN:
            raise serializers.ValidationError('cannot register as admin')
        return value
    
    def create(self,validated_data):
        password=validated_data.pop('password')
        user=User.objects.create_user(password=password, **validated_data)
        return user
    
class LoginSerializer(serializers.Serializer):
    phone=serializers.CharField()
    password=serializers.CharField(write_only=True)

    def validate(self,data):
        phone    = data.get('phone')
        password = data.get('password')

        user = authenticate(username=phone, password=password)

        if not user:
            raise serializers.ValidationError("Invalid phone number or password.")
        if not user.is_active:
            raise serializers.ValidationError("This account has been deactivated.")


        data['user']=user
        return data
    
class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['id','phone','full_name','email','role','area','created_at']

class WorkerProfileSerializer(serializers.ModelSerializer):
    user=UserSerializer(read_only=True)

    class Meta:
        model=WorkerProfile
        fields=[
            'id', 'user', 'bio', 'experience_years',
            'is_verified', 'is_available',
            'avg_rating', 'total_jobs', 'citizenship_photo'
        ]

class UpdateProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model=User
        fields=['full_name','email','area']


class ChangePasswordSerializer(serializers.Serializer):
    old_password=serializers.CharField(write_only=True)
    new_password=serializers.CharField(write_only=True,min_length=6)


    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError("Old password is incorrect.")
        return value