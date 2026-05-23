from django.shortcuts import render
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

from .models import Category, Service, WorkerService, WorkerAvailability
from .serializers import (
    CategorySerializer, ServiceSerializer,
    WorkerServiceSerializer, WorkerAvailabilitySerializer,
    WorkerPublicProfileSerializer
)
from accounts.models import WorkerProfile

# Create your views here.


class CategoryListView(generics.ListAPIView):
    queryset=Category.objects.filter(is_active=True)
    serializer_class=CategorySerializer
    permission_classes=[AllowAny]


class ServiceListView(generics.ListAPIView):
    queryset=Service.objects.filter(is_active=True).select_related('category')
    serializer_class=ServiceSerializer
    permission_classes=[AllowAny]
    filter_backends=[DjangoFilterBackend,SearchFilter,OrderingFilter]
    filterset_fields=['category']
    search_fields=['name','description']
    ordering_fields=['base_price','name']


class ServiceDetailView(generics.RetrieveAPIView):
    queryset           = Service.objects.filter(is_active=True)
    serializer_class   = ServiceSerializer
    permission_classes = [AllowAny]

class WorkerListView(generics.ListAPIView):
    serializer_class   = WorkerPublicProfileSerializer
    permission_classes = [AllowAny]
    filter_backends    = [SearchFilter, OrderingFilter]
    search_fields      = ['user__full_name', 'user__area']
    ordering_fields    = ['avg_rating', 'total_jobs']

    def get_queryset(self):
       
        queryset = WorkerProfile.objects.filter(
            is_verified=True,
            is_available=True,
            user__is_active=True
        ).select_related('user')

       
        area = self.request.query_params.get('area')
        if area:
            queryset = queryset.filter(user__area__icontains=area)

        service_id = self.request.query_params.get('service')
        if service_id:
            queryset = queryset.filter(
                user__worker_services__service_id=service_id,
                user__worker_services__is_active=True
            )

       
        return queryset

class WorkerDetailView(generics.RetrieveAPIView):
        queryset           = WorkerProfile.objects.filter(is_verified=True)
        serializer_class   = WorkerPublicProfileSerializer
        permission_classes = [AllowAny]

    
class MyServicesView(APIView):
     permission_classes = [IsAuthenticated]

     def get(self,request):
          if not request.user.is_worker:
               return Response({'error':'Only workers can access this.'},status=403)
          
          services=WorkerService.objects.filter(worker=request.user)
          serializer=WorkerServiceSerializer(services,many=True)
          return Response(serializer.data)
     
     def post(self, request):
        if not request.user.is_worker:
            return Response({'error': 'Only workers can access this.'}, status=403)

        serializer = WorkerServiceSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(worker=request.user)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class MyServiceDetailView(APIView):
    permission_classes=[IsAuthenticated]

    def get_object(self,pk,user):
        try:
            return WorkerService.objects.get(pk=pk,worker=user)
        except WorkerService.DoesNotExist:
            return None
        
    
    def put(self,request,pk):
        obj=self.get_object(pk,request.user)
        if not obj:
            return Response({'error':'Not found.'},status=404)
        
        serializer=WorkerServiceSerializer(obj,data=request.data,partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.error, status=400)
    
    def delete(self,request,pk):
        obj=self.get_object(pk,request.user)
        if not obj:
            return Response({'error':'Not found'},status=404)
        obj.delete()
        return Response({'message':'Service removed.'},status=204)
    


class MyAvailabilityView(APIView):
    permission_classes=[IsAuthenticated]

    def get(self, request):
        if not request.user.is_worker:
            return Response({'error':'Only Workers can access this.'},status=403)
        availability=WorkerAvailability.objects.filter(worker=request.user)
        serializer=WorkerAvailabilitySerializer(availability,many=True)
        return Response(serializer.data)
    
    def post(self, request):
        if not request.user.is_worker:
            return Response({'error': 'Only workers can access this.'}, status=403)
        serializer = WorkerAvailabilitySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(worker=request.user)
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)


class WorkerCreateServiceView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_worker:
            return Response({'error': 'Only workers can do this.'}, status=403)

     
        service_data = {
            'name': request.data.get('name'),
            'description': request.data.get('description', ''),
            'base_price': request.data.get('my_price'),  # use their price as base
            'duration_hours': request.data.get('my_duration', 1.0),
            'category': request.data.get('category_id'),
            'is_active': True,
        }
        service_serializer = ServiceSerializer(data=service_data)
        if not service_serializer.is_valid():
            return Response(service_serializer.errors, status=400)
        service = service_serializer.save()

       
        worker_service = WorkerService.objects.create(
            worker=request.user,
            service=service,
            my_price=request.data.get('my_price'),
            my_duration=request.data.get('my_duration', 1.0),
            is_active=True,
        )
        serializer = WorkerServiceSerializer(worker_service)
        return Response(serializer.data, status=201)