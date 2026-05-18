from django.urls import path
from . import views

urlpatterns = [
    path('create/',              views.CreateReviewView.as_view(),   name='create_review'),
    path('worker/<int:worker_id>/', views.WorkerReviewsView.as_view(), name='worker_reviews'),
    path('my-reviews/',          views.MyReviewsView.as_view(),      name='my_reviews'),
    path('pending/',             views.PendingReviewsView.as_view(), name='pending_reviews'),
]