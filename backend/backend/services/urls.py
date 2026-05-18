from django.urls import path
from . import views

urlpatterns = [
   
    path('categories/',         views.CategoryListView.as_view(),    name='categories'),
    path('',                    views.ServiceListView.as_view(),     name='services'),
    path('<int:pk>/',           views.ServiceDetailView.as_view(),   name='service_detail'),
    path('workers/',            views.WorkerListView.as_view(),      name='workers'),
    path('workers/<int:pk>/',   views.WorkerDetailView.as_view(),   name='worker_detail'),


    path('my-services/',        views.MyServicesView.as_view(),      name='my_services'),
    path('my-services/<int:pk>/', views.MyServiceDetailView.as_view(), name='my_service_detail'),
    path('my-availability/',    views.MyAvailabilityView.as_view(),  name='my_availability'),
]