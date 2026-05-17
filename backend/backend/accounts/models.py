from django.db import models
from django.contrib.auth.models import AbstractBaseUser,BaseUserManager,PermissionsMixin
# Create your models here.


class UserManager(BaseUserManager):

    def create_user(self,phone,password=None, **extra_fields):
        if not phone:
            raise ValueError('Phone number required')
        user=self.model(phone=phone, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self,phone,password=None,**extra_fields):
        extra_fields.setdefault('is_staff',True)
        extra_fields.setdefault('is_superuser','True')
        extra_fields.setdefault('role','admin')
        return self.create_user(phone, password, **extra_fields)
    

class User(AbstractBaseUser,PermissionsMixin):

    CUSTOMER='customer'
    WORKER='worker'
    ADMIN='admin'
    ROLE_CHOICES=[
        (CUSTOMER, 'Customer'),
        (WORKER, 'Worker'),
        (ADMIN, 'Admin'),

    ]

    phone=models.CharField(max_length=15,unique=True)
    email=models.EmailField(blank=True,null=True)
    full_name=models.CharField(max_length=100)
    role=models.CharField(max_length=10,choices=ROLE_CHOICES,default=CUSTOMER)
    area=models.CharField(max_length=100,blank=True)
    
    is_active=models.BooleanField(default=True)
    is_staff=models.BooleanField(default=False)

    created_at=models.DateTimeField(auto_now_add=True)
    updated_at=models.DateTimeField(auto_created=True)

    groups=models.ManyToManyField(
        'auth.Group',
        blank=True,
        related_name='accounts_user',
        help_text='Groups this user belongs to..',
        verbose_name='groups',
    )
    user_permissions=models.ManyToManyField(
        'auth.Permission',
        blank=True,
        related_name='accounts_users',
        help_text='Specific permissions for this user.',
        verbose_name='User permissions',
    )

    objects=UserManager()

    USERNAME_FIELDS='phone'
    REQUIRED_FIELDS=['full_name']


    def __str__(self):
        return f"{self.full_name}({self.role})"
    
    @property
    def is_customer(self):
        return self.role==self.CUSTOMER
    

    @property
    def is_worker(self):
        return self.role==self.WORKER
    

class WorkerProfile(models.Model):

    user= models.OneToOneField(User, on_delete=models.CASCADE, related_name='worker_profile')
    bio= models.TextField(blank=True)
    experience_years = models.PositiveIntegerField(default=0)
    is_verified = models.BooleanField(default=False)  
    is_available = models.BooleanField(default=True)  

    avg_rating  = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_jobs  = models.PositiveIntegerField(default=0)

    citizenship_photo = models.ImageField(upload_to='citizenship/', blank=True, null=True)

    def __str__(self):
        return f"Profile of {self.user.full_name}"