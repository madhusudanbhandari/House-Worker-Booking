from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import Booking, BookingStatusHistory
from .serializers import (
    BookingSerializer,
    CreateBookingSerializer,
    UpdateBookingStatusSerializer
)


def record_status_change(booking, old_status, new_status, changed_by, note=''):
    BookingStatusHistory.objects.create(
        booking    = booking,
        old_status = old_status,
        new_status = new_status,
        changed_by = changed_by,
        note       = note
    )


class CreateBookingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        if not request.user.is_customer:
            return Response(
                {'error': 'Only customers can create bookings.'},
                status=status.HTTP_403_FORBIDDEN
            )

        worker_id    = request.data.get('worker_id')
        service_id   = request.data.get('service_id')
        address      = request.data.get('address')
        area         = request.data.get('area')
        scheduled_at = request.data.get('scheduled_at')
        note         = request.data.get('note', '')

        if not all([worker_id, service_id, address, area, scheduled_at]):
            return Response(
                {'error': 'worker_id, service_id, address, area and scheduled_at are all required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        from accounts.models import User, WorkerProfile
        from services.models import WorkerService

        # ── DEBUG: print all users to see what exists ──
        all_users = User.objects.all().values('id', 'full_name', 'role', 'phone')
        print("ALL USERS IN DB:", list(all_users))
        print("Trying worker_id:", worker_id, "type:", type(worker_id))

        # ── try finding worker without role filter first ──
        try:
            any_user = User.objects.get(id=worker_id)
            print("Found user:", any_user.full_name, "role:", any_user.role)
        except User.DoesNotExist:
            print("No user with id:", worker_id)
            return Response({'error': f'No user exists with id {worker_id}'}, status=400)

        # ── now check role ──
        if any_user.role != 'worker':
            return Response(
                {'error': f'User found but role is {any_user.role}, not worker.'},
                status=400
            )

        worker = any_user

        # ── check worker is verified and available ──
        try:
            profile = worker.worker_profile
            print("Worker profile found. verified:", profile.is_verified, "available:", profile.is_available)
            if not profile.is_verified:
                return Response({'error': 'This worker is not verified yet.'}, status=400)
            if not profile.is_available:
                return Response({'error': 'This worker is not available.'}, status=400)
        except WorkerProfile.DoesNotExist:
            return Response({'error': 'Worker profile not found.'}, status=400)

        # ── check worker offers this service ──
        try:
            worker_service = WorkerService.objects.get(
                worker=worker,
                service_id=service_id,
                is_active=True
            )
            print("Worker service found:", worker_service)
        except WorkerService.DoesNotExist:
            all_ws = WorkerService.objects.filter(worker=worker).values('service_id', 'is_active')
            print("Worker services in DB:", list(all_ws))
            return Response(
                {'error': f'Worker does not offer service_id {service_id}. Their services: {list(all_ws)}'},
                status=400
            )

        # ── parse scheduled_at ──
        from django.utils.dateparse import parse_datetime
        scheduled_dt = parse_datetime(str(scheduled_at))
        if not scheduled_dt:
            return Response({'error': 'Invalid date format. Use: 2026-06-01T10:00:00Z'}, status=400)

        from django.utils import timezone
        if scheduled_dt < timezone.now():
            return Response({'error': 'Scheduled time cannot be in the past.'}, status=400)

        # ── create the booking ──
        booking = Booking.objects.create(
            customer     = request.user,
            worker       = worker,
            service_id   = service_id,
            address      = address,
            area         = area,
            scheduled_at = scheduled_dt,
            note         = note,
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
    
class CustomerBookingListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bookings = Booking.objects.filter(
            customer=request.user
        ).select_related('worker', 'service', 'service__category')

        status_filter = request.query_params.get('status')
        if status_filter:
            bookings = bookings.filter(status=status_filter)

        serializer = BookingSerializer(bookings, many=True)
        return Response(serializer.data)


class WorkerBookingListView(APIView):
    permission_classes = [IsAuthenticated]

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
        new_status = request.data.get('status')
        note       = request.data.get('note', '')

        if not new_status:
            return Response({'error': 'status field is required.'}, status=400)

        old_status = booking.status
        user       = request.user

        # ── Worker actions ──
        if user == booking.worker:
            allowed = {
                Booking.PENDING    : [Booking.ACCEPTED, Booking.REJECTED],
                Booking.ACCEPTED   : [Booking.IN_PROGRESS],
                Booking.IN_PROGRESS: [Booking.COMPLETED],
            }
            if new_status not in allowed.get(old_status, []):
                return Response(
                    {'error': f'Cannot change status from {old_status} to {new_status}.'},
                    status=400
                )

            booking.status = new_status

            if new_status == Booking.REJECTED:
                booking.rejection_reason = note

            if new_status == Booking.COMPLETED:
                profile = booking.worker.worker_profile
                profile.total_jobs += 1
                profile.save()

        # ── Customer actions ──
        elif user == booking.customer:
            if new_status != Booking.CANCELLED:
                return Response({'error': 'Customers can only cancel bookings.'}, status=403)
            if old_status != Booking.PENDING:
                return Response({'error': 'You can only cancel pending bookings.'}, status=400)

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
                'total'    : bookings.count(),
                'pending'  : bookings.filter(status=Booking.PENDING).count(),
                'active'   : bookings.filter(status__in=[Booking.ACCEPTED, Booking.IN_PROGRESS]).count(),
                'completed': bookings.filter(status=Booking.COMPLETED).count(),
                'cancelled': bookings.filter(status=Booking.CANCELLED).count(),
            })

        elif user.is_worker:
            bookings     = Booking.objects.filter(worker=user)
            completed    = bookings.filter(status=Booking.COMPLETED)
            total_earned = sum(b.total_price for b in completed)
            return Response({
                'total'       : bookings.count(),
                'pending'     : bookings.filter(status=Booking.PENDING).count(),
                'active'      : bookings.filter(status__in=[Booking.ACCEPTED, Booking.IN_PROGRESS]).count(),
                'completed'   : completed.count(),
                'total_earned': total_earned,
            })

        return Response({'error': 'Invalid user role.'}, status=400)