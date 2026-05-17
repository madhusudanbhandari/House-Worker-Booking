from django.shortcuts import render
from rest_framework import status, generics
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework_simplejwt.tokens import RefreshToken

from .models import User, WorkerProfile
from .serializers import (
    RegisterSerializer, LoginSerializer, UserSerializer,
    WorkerProfileSerializer, UpdateProfileSerializer,
    ChangePasswordSerializer
)


# Create your views here.


def get_tokens_for_user(user):
    refresh = RefreshToken.for_user(user)
    return {
        'refresh': str(refresh),
        'access': str(refresh.access_token),
    }

class RegisterView(APIView):
    permission_classes=[AllowAny]


    def post(self,request):
        serializer=RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user=serializer.save()
            tokens=get_tokens_for_user(user)

            if user.role==User.WORKER:
                WorkerProfile.objects.create(user=user)

            return Response({
                'message': 'Registration successful.',
                'user'   : UserSerializer(user).data,
                'tokens' : tokens,
            },status=status.HTTP_201_CREATED)
        

class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self,request):
        serializer=LoginSerializer(data=request.data)

        if serializer.is_valid():
            user=serializer.validated_data['user']
            tokens=get_tokens_for_user(user)

            return Response({
               'message': 'Login successful.',
                'user'   : UserSerializer(user).data,
                'tokens' : tokens, 
            },status=status.HTTP_200_OK)
        
        return Response(serializer.errors,status=status.HTTP_400_BAD_REQUEST)
    

class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            token = RefreshToken(refresh_token)
            token.blacklist()  
            return Response({'message': 'Logged out successfully.'})
        except Exception:
            return Response({'error': 'Invalid token.'}, status=status.HTTP_400_BAD_REQUEST)

class ProfileView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self,request):
        serializer=UserSerializer(request.user)
        return Response(serializer.data)
    
    def put(self,request):
        serializer=UpdateProfileSerializer(
            request.user,
            data=request.data,
            partial=True
        )

        if serializer.is_valid():
            serializer.save()
            return Response({
                'message': 'Profile updated.',
                'user'   : UserSerializer(request.user).data,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class ChangePasswordView(APIView):
    permission_classes=[IsAuthenticated]
    def post(self,request):
        serializer=ChangePasswordSerializer(data=request.data, context={'request': request})

        if serializer.is_valid():
            user=request.user
            user.set_password(serializer.validated_data['new_password'])
            user.save()
            return Response({'message': 'Password changed successfully.'})
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
class WorkerProfileView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self,request):
        if not request.user.is_worker:
            return Response({'error': 'Only workers can access this.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            profile=request.user.worker_profile
            serializer=WorkerProfileSerializer(profile)
            return Response(serializer.data)
        except WorkerProfile.DoesNotExist:
            return Response({'error': 'Worker profile not found.'}, status=status.HTTP_404_NOT_FOUND)
        
    def put(self, request):
        if not request.user.is_worker:
            return Response(
                {'error': 'Only workers can access this.'},
                status=status.HTTP_403_FORBIDDEN
            )
        profile    = request.user.worker_profile
        serializer = WorkerProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response({'message': 'Profile updated.', 'profile': serializer.data})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)