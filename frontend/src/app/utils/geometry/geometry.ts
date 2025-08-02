import { Coordinate, Polygon } from "../types";

// Helper function to create a circle fence
export function create_circle_fence(radius: number, center: Coordinate, fillColor: string, strokeColor: string, map: google.maps.Map): google.maps.Circle {
    return new google.maps.Circle({
        strokeColor: strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: fillColor,
        fillOpacity: 0.35,
        map: map,
        center: { lat: center.lat, lng: center.lon },
        radius: radius // meters
    });
}

// Helper function to create a polygon fence
export function create_polygon_fence(polygon: Polygon, fillColor: string, strokeColor: string, map: google.maps.Map): google.maps.Polygon {
    return new google.maps.Polygon({
        paths: polygon,
        strokeColor: strokeColor,
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: fillColor,
        fillOpacity: 0.35,
        map: map
    });
}

/*
 * Some custom geometry Math Functions to do some 2D collision detection
 *
 * i.e useful to check if a vehicle is inside a fence (Geofence)
 *     to then propogate live updates to the user if they entered
 *     high risk zones or exited them.
 * 
 *     Please NOTE these are not Generic, They are specific to the Google Maps API
 *     and the types of objects they are working with.
 * 
 *     This is a work in progress and will be updated as we go.
 * 
 *     For now, this is a simple implementation of the algorithm.
 * 
 *     We will be using the Google Maps API to do the heavy lifting.
 */

export function is_point_inside_circle(point: Coordinate, circle: google.maps.Circle): boolean {
    const userLatLng = new google.maps.LatLng(point.lat, point.lon);
    const center = circle.getCenter();
    if (!center) {
        return false;
    }
    return google.maps.geometry.spherical.computeDistanceBetween(
        userLatLng,
        center
    ) < circle.getRadius();
}
