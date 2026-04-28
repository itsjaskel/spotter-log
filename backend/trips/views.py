from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .serializers import TripInputSerializer, TripOutputSerializer
from .models import Trip
from .routing_service import build_route
from .hos_calculator import calculate_trip


class TripView(APIView):
    def post(self, request):
        serializer = TripInputSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data

        try:
            route = build_route(
                data["current_location"],
                data["pickup_location"],
                data["dropoff_location"],
            )
        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception:
            return Response(
                {"error": "Could not calculate route. Check location names and try again."},
                status=status.HTTP_502_BAD_GATEWAY,
            )

        hos_result = calculate_trip(route, data["current_cycle_hours"])

        trip = Trip.objects.create(
            current_location=data["current_location"],
            pickup_location=data["pickup_location"],
            dropoff_location=data["dropoff_location"],
            current_cycle_hours=data["current_cycle_hours"],
            route_data=route,
            logs_data=hos_result,
        )

        return Response(TripOutputSerializer(trip).data, status=status.HTTP_201_CREATED)
