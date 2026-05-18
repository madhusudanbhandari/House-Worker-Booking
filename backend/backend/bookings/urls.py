from django.urls import path
from . import views

urlpatterns = [
    path('create/',                      views.CreateBookingView.as_view(),       name='create_booking'),
    path('my-bookings/',                 views.CustomerBookingListView.as_view(),  name='my_bookings'),
    path('worker-bookings/',             views.WorkerBookingListView.as_view(),    name='worker_bookings'),
    path('stats/',                       views.BookingStatsView.as_view(),         name='booking_stats'),
    path('<int:pk>/',                    views.BookingDetailView.as_view(),        name='booking_detail'),
    path('<int:pk>/update-status/',      views.UpdateBookingStatusView.as_view(),  name='update_status'),
]