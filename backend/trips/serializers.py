from rest_framework import serializers
from .models import Trip


class TripInputSerializer(serializers.Serializer):
    current_location = serializers.CharField()
    pickup_location = serializers.CharField()
    dropoff_location = serializers.CharField()
    current_cycle_hours = serializers.FloatField(min_value=0, max_value=70)


class TripOutputSerializer(serializers.ModelSerializer):
    class Meta:
        model = Trip
        fields = [
            "id",
            "current_location",
            "pickup_location",
            "dropoff_location",
            "current_cycle_hours",
            "route_data",
            "logs_data",
            "created_at",
        ]
