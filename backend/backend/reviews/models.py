from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from accounts.models import User
from bookings.models import Booking
from django.db.models import Avg

# Create your models here.

class Review(models.Model):
    booking=models.OneToOneField(
        Booking,
        on_delete=models.CASCADE,
        related_name='review'
    )

    customer=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_given'
    )
    worker=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='reviews_received'
    )

    rating=models.PositiveIntegerField(
        validators=[MinValueValidator(1),MaxValueValidator(5)]

    )
    comment=models.TextField(blank=True)
    created_at=models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering=['-created_at']
        verbose_name='Review'
        verbose_name_plural='Reviews'

    def __str__(self):
        return f"Review by {self.customer.full_name} for {self.worker.full_name}-{self.rating}"
    
    def save(self,*args, **kwargs):
        super().save(*args, **kwargs)
        self.update_worker_rating()

    def update_worker_rating(self):
      
        profile=self.worker.worker_profile
        avg=Review.objects.filter(worker=self.worker).aggregate(Avg('rating'))
        profile.avg_rating=avg['rating__avg'] or 0
        profile.save()