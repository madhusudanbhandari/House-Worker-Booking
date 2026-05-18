from django.db import models
from accounts.models import User
from services.models import Service
from django.utils import timezone
# Create your models here.

class Booking(models.Model):
    PENDING     = 'pending'      
    ACCEPTED    = 'accepted'     
    REJECTED    = 'rejected'     
    IN_PROGRESS = 'in_progress'  
    COMPLETED   = 'completed'    
    CANCELLED   = 'cancelled'  


    STATUS_CHOICES = [
        (PENDING,     'Pending'),
        (ACCEPTED,    'Accepted'),
        (REJECTED,    'Rejected'),
        (IN_PROGRESS, 'In Progress'),
        (COMPLETED,   'Completed'),
        (CANCELLED,   'Cancelled'),
    ]

    customer     = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='customer_bookings',
        limit_choices_to={'role': 'customer'}
    )
    worker       = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='worker_bookings',
        limit_choices_to={'role': 'worker'}
    )
    service      = models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='bookings'
    )

    address=models.TextField()
    area=models.CharField(max_length=100)
    scheduled_at=models.DateTimeField()
    note=models.TextField(blank=True)
    total_price=models.DecimalField(max_digits=8,decimal_places=2)

    status=models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default=PENDING
    )

    rejection_reason=models.TextField(blank=True)
    cancellation_reason=models.TextField(blank=True)

    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(null=True,blank=True)

    class Meta:
        ordering=['-created_at']
        verbose_name='Booking'
        verbose_name_plural='Bookings'

    def save(self, *args, **kwargs):        
        self.updated_at=timezone.now()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Booking #{self.id}={self.customer.full_name}->{self.worker.full_name}"


class BookingStatusHistory(models.Model):
    booking=models.ForeignKey(
        Booking,
        on_delete=models.CASCADE,
        related_name='status_history'
    )
    old_status=models.CharField(max_length=20)
    new_status=models.CharField(max_length=20)

    changed_by=models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True
    )
    note=models.TextField(blank=True)
    changed_at=models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering=['changed_at']
        verbose_name='Status History'
        verbose_name_plural='Status Histories'

    def __str__(self):
        return f"Booking #{self.booking.id}: {self.old_status} → {self.new_status}"

