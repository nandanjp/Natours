const displayMap = (locations) => {
    mapboxgl.accessToken =
        "pk.eyJ1Ijoia3Vqb2ZvcmFsbCIsImEiOiJja2tscm9uNGwxNmdqMnBxbmpsaXJtczltIn0.DAZ-WcI8dkcB3jiHRnO7yg";
    var map = new mapboxgl.Map({
        container: "map", //Puts this on an element with the id map
        style: "mapbox://styles/kujoforall/ckkls7p0a0u9017pc6hkjsvg6",
        scrollZoom: false,
        // center: [-118.113491, 34.111745],
        // zoom: 10,
    });

    const bounds = new mapboxgl.LngLatBounds();

    locations.forEach((location) => {
        //CREATE MARKER
        const el = document.createElement("div");
        el.className = "marker";

        //ADD MARKER
        new mapboxgl.Marker({
            element: el,
            anchor: "bottom",
        })
            .setLngLat(location.coordinates)
            .addTo(map);

        //ADD a POPUP
        new mapboxgl.Popup({
            offset: 30,
        })
            .setLngLat(location.coordinates)
            .setHTML(`<p>Day ${location.day}: ${location.description}</p>`)
            .addTo(map);

        //Extend map bounds to include the current locations
        bounds.extend(location.coordinates);
    });

    map.fitBounds(bounds, {
        padding: {
            top: 200,
            bottom: 150,
            left: 100,
            right: 100,
        },
    });
};

export default displayMap;
