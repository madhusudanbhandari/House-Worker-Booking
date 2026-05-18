from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404

from .models import Booking, BookingStatusHistory
from .serializers import (
    BookingSerializer,
    CreateBookingSerializer,
    UpdateBookingStatusSerializer
)
from services.models import Service
# Create your views here.

def record_status_change(booking, old_status, new_status, changed_by, note=''):
    BookingStatusHistory.objects.create(
        booking=booking,
        old_status=old_status,
        new_status=new_status,
        changed_by=changed_by,
        note=note
    )


class CreateBookingView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request):
        if not request.user.is_customer:
            return Response(
                {'error':'Only customers can create bookings'}

            )
        
        serializer=CreateBookingSerializer(data=request.data)
        if serializer.is_valid():
            data=serializer.vaildated_data
            worker=data['worker']
            worker_service=data['worker_service']

            booking = Booking.objects.create(
                customer     = request.user,
                worker       = worker,
                service_id   = data['service_id'],
                address      = data['address'],
                area         = data['area'],
                scheduled_at = data['scheduled_at'],
                note         = data.get('note', ''),
                total_price  = worker_service.my_price,
                status       = Booking.PENDING
            )

            record_status_change(
                booking    = booking,
                old_status = '',
                new_status = Booking.PENDING,
                changed_by = request.user,
                note       = 'Booking created'
            )

            return Response(
                BookingSerializer(booking).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class CustomerBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            customer=request.user
        ).select_related('worker', 'service', 'service__category')

        # Optional status filter
        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)
    

class WorkerBookingListView(APIView):
    permission_classes=[IsAuthenticated]
    
    def get(self, request):
        if not request.user.is_worker:
            return Response({'error': 'Only workers can access this.'}, status=403)

        bookings = Booking.objects.filter(
            worker=request.user
        ).select_related('customer', 'service', 'service__category')

        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)

  
class BookingDetailView(APIView):  
    permission_classes = [IsAuthenticated]


    def get(self, request, pk):
        booking = get_object_or_404(Booking, pk=pk)

       
        if request.user != booking.customer and request.user != booking.worker:
            return Response({'error': 'Access denied.'}, status=403)

        serializer = BookingSerializer(booking)
        return Response(serializer.data)
    

class UpdateBookingStatusView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        booking    = get_object_or_404(Booking, pk=pk)
        serializer = UpdateBookingStatusSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(serializer.errors, status=400)

        new_status = serializer.validated_data['status']
        note       = serializer.validated_data.get('note', '')
        old_status = booking.status
        user       = request.user

        if user == booking.worker:
            allowed = {
                Booking.PENDING    : [Booking.ACCEPTED, Booking.REJECTED],
                Booking.ACCEPTED   : [Booking.IN_PROGRESS],
                Booking.IN_PROGRESS: [Booking.COMPLETED],
            }
          
            if new_status not in allowed.get(old_status, []):
                return Response(
                    {'error': f'Cannot change from {old_status} to {new_status}.'},
                    status=400
                )

            booking.status = new_status

            if new_status == Booking.REJECTED:
                booking.rejection_reason = note

            
            if new_status == Booking.COMPLETED:
                profile = booking.worker.worker_profile
                profile.total_jobs += 1
                profile.save()


        elif user == booking.customer:
            if new_status != Booking.CANCELLED:
                return Response({'error': 'Customers can only cancel bookings.'}, status=403)
            if old_status != Booking.PENDING:
                return Response(
                    {'error': 'Can only cancel pending bookings.'},
                    status=400
                )
            booking.status              = Booking.CANCELLED
            booking.cancellation_reason = note

        else:
            return Response({'error': 'Access denied.'}, status=403)

        booking.save()

     
        record_status_change(booking, old_status, new_status, user, note)

        return Response(BookingSerializer(booking).data)


class BookingStatsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user

        if user.is_customer:
            bookings = Booking.objects.filter(customer=user)
            return Response({
                'total'      : bookings.count(),
                'pending'    : bookings.filter(status=Booking.PENDING).count(),
                'active'     : bookings.filter(status__in=[Booking.ACCEPTED, Booking.IN_PROGRESS]).count(),
                'completed'  : bookings.filter(status=Booking.COMPLETED).count(),
                'cancelled'  : bookings.filter(status=Booking.CANCELLED).count(),
            })

        elif user.is_worker:
            bookings = Booking.objects.filter(worker=user)
            total_earned = sum(
                b.total_price for b in bookings.filter(status=Booking.COMPLETED)
            )
            return Response({
                'total'       : bookings.count(),
                'pending'     : bookings.filter(status=Booking.PENDING).count(),
                'active'      : bookings.filter(status__in=[Booking.ACCEPTED, Booking.IN_PROGRESS]).count(),
                'completed'   : bookings.filter(status=Booking.COMPLETED).count(),
                'total_earned': total_earned,
            })

        return Response({'error': 'Invalid user role.'}, status=400)      