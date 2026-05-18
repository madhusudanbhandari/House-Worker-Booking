from django.db import models
from accounts.models import User

# Create your models here.

class Category(models.Model):
    name=models.CharField(max_length=100,unique=True)
    description=models.TextField(blank=True)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)


    class Meta:
        verbose_name_plural='Categories'
        ordering=['name']


    def __str__(self):
        return self.name
    

class Service(models.Model):
    category=models.ForeignKey(
        Category,
        on_delete=models.CASCADE,
        related_name='services'
    )

    name=models.CharField(max_length=200)
    description=models.TextField(blank=True)
    base_price=models.DecimalField(max_digits=8,decimal_places=2)
    duration_hours=models.DecimalField(max_digits=4,decimal_places=1,default=1.0)
    is_active=models.BooleanField(default=True)
    created_at=models.DateTimeField(auto_now_add=True)


    class Meta:
        ordering=['category','name']

    def __str__(self):
        return f"{self.category.name}->{self.name}"
    

class WorkerService(models.Model):

    worker=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='worker_services',
        limit_choices_to={'role':'worker'}

    )

    service=models.ForeignKey(
        Service,
        on_delete=models.CASCADE,
        related_name='worker_services'
    )
    my_price=models.DecimalField(max_digits=8, decimal_places=2)
    my_duration=models.DecimalField(max_digits=4, decimal_places=1,default=1.0)
    is_active=models.BooleanField(default=True)


    class Meta:
        unique_together=['worker','service']


    def __str__(self):
        return f"{self.worker.full_name} offers {self.service.name}"
    

class WorkerAvailability(models.Model):
    DAYS=[
        (0,'Sunday'),
        (1,'Monday'),
        (2,'Tuesday'),
        (3,'Wednesday'),
        (4,'Thursday'),
        (5,'Friday'),
        (6,'Saturday'),
    ]

    worker=models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='availability'
    )
    day_of_week=models.IntegerField(choices=DAYS)
    start_time=models.TimeField()
    end_time=models.TimeField()
    is_active=models.BooleanField(default=True)

    class Meta:
        unique_together=['worker','day_of_week']
        ordering=['day_of_week']

    def __st__(self):
        return f"{self.worker.full_name}-{self.get_day_of_week_display()}"
    
