from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework import status

from .models import Review
from .serializers import ReviewSerializer, CreateReviewSerializer
from bookings.models import Booking
from accounts.models import WorkerProfile

# Create your views here.

class CreateReviewView(APIView):
    permission_classes=[IsAuthenticated]

    def post(self,request):
        if not request.user.is_customer:
            return Response(
                {'error':'Only customers can leave reviews'},
                status=status.HTTP_403_FORBIDDEN

            )
        serializer=CreateReviewSerializer(data=request.data)
        if serializer.is_valid():
            data=serializer.validated_data
            booking=Booking.objects.get(id=data['booking_id'])


            if booking.customer!=request.user:
                return Response(
                    {'error':'You can only review your own bookings'},
                    status=status.HTTp_403_FORBIDDEN
                )
            
            review=Review.objects.create(
                booking  = booking,
                customer = request.user,
                worker   = booking.worker,
                rating   = data['rating'],
                comment  = data.get('comment', '')
            )
            return Response(
                ReviewSerializer(review).data,
                status=status.HTTP_201_CREATED
            )

        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    

class WorkerReviewsView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, worker_id):
        reviews = Review.objects.filter(
            worker_id=worker_id
        ).select_related('customer', 'worker')

        
        total   = reviews.count()
        avg     = 0
        if total > 0:
            avg = sum(r.rating for r in reviews) / total

        return Response({
            'worker_id'    : worker_id,
            'total_reviews': total,
            'avg_rating'   : round(avg, 2),
            'reviews'      : ReviewSerializer(reviews, many=True).data
        })

class MyReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        reviews    = Review.objects.filter(customer=request.user)
        serializer = ReviewSerializer(reviews, many=True)
        return Response(serializer.data)




class PendingReviewsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        if not request.user.is_customer:
            return Response(
                {'error': 'Only customers can access this.'},
                status=403
            )

        from bookings.models import Booking
        completed_bookings = Booking.objects.filter(
            customer=request.user,
            status=Booking.COMPLETED
        )

        
        pending = [b for b in completed_bookings if not hasattr(b, 'review')]

        from bookings.serializers import BookingSerializer
        return Response(BookingSerializer(pending, many=True).data)
