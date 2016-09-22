# -*- coding: utf-8 -*-
# Generated by Django 1.9.6 on 2016-09-15 15:42
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion
import vmprofile.models
import uuid


def forward_func(apps, schema_editor):
    RuntimeData = apps.get_model("vmprofile", "RuntimeData")
    CPUProfile = apps.get_model("vmprofile", "CPUProfile")
    for prof in CPUProfile.objects.all():
        rd = RuntimeData.objects.create()
        rd.created = prof.created
        rd.user = prof.user
        rd.name = prof.name
        rd.save()
        prof.runtime_data = rd
        prof.save()

def backward_func(apps, schema_editor):
    RuntimeData = apps.get_model("vmprofile", "RuntimeData")
    CPUProfile = apps.get_model("vmprofile", "CPUProfile")
    for rd in RuntimeData.objects.all():
        cpup = rd.cpu_profile
        cpup.created = rd.created
        cpup.user = rd.user
        cpup.name = rd.name
        cpup.vm = rd.vm
        cpup.save()
    RuntimeData.objects.delete()

class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('vmprofile', '0006_auto_20160915_1531'),
    ]

    operations = [
        migrations.CreateModel(
            name='RuntimeData',
            fields=[
                ('runtime_id', models.CharField(default=uuid.uuid4, max_length=64, primary_key=True, unique=True, serialize=False)),
                ('created', models.DateTimeField(auto_now_add=True)),
                ('vm', models.CharField(blank=True, max_length=32)),
                ('name', models.CharField(blank=True, max_length=256)),
                ('user', models.ForeignKey(null=True, on_delete=django.db.models.deletion.CASCADE, to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created'],
            },
        ),
        migrations.AddField(
            model_name='cpuprofile',
            name='runtime_data',
            field=models.OneToOneField(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE,
                                       related_name='cpu_profile', to='vmprofile.RuntimeData'),
        ),
        migrations.RunPython(forward_func, backward_func),
        migrations.AlterModelOptions(
            name='cpuprofile',
            options={},
        ),
        migrations.RemoveField(
            model_name='cpuprofile',
            name='created',
        ),
        migrations.RemoveField(
            model_name='cpuprofile',
            name='name',
        ),
        migrations.RemoveField(
            model_name='cpuprofile',
            name='user',
        ),
        migrations.RemoveField(
            model_name='cpuprofile',
            name='vm',
        ),
        migrations.AlterField(
            model_name='cpuprofile',
            name='checksum',
            field=models.CharField(max_length=128, primary_key=True, serialize=False),
        ),
        migrations.AddField(
            model_name='cpuprofile',
            name='file',
            field=models.FileField(null=True, upload_to=vmprofile.models.get_profile_storage_directory),
        ),
        migrations.AlterField(
            model_name='cpuprofile',
            name='data',
            field=models.TextField(null=True),
        ),
    ]
