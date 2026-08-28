# SAF airport locations on the jurisdiction map

Add a layer of airports that supply sustainable aviation fuel (SAF) on top of the jurisdiction map, so readers can see where SAF is actually uplifted, not just which countries have policy.

## What you get

- Roughly 45–55 curated airports worldwide with confirmed SAF supply (blended into the hydrant system or via regular truck uplift): e.g. Amsterdam Schiphol, Oslo, Stockholm Arlanda, Paris CDG, London Heathrow, Frankfurt, Madrid, Rome Fiumicino, Zurich, San Francisco, Los Angeles, Chicago O'Hare, Seattle, Houston, Toronto, Singapore Changi, Tokyo Narita/Haneda, Seoul Incheon, Hong Kong, Dubai, Sydney, Auckland.
- Each airport appears as a small diamond/dot marker at its true latitude and longitude, scaled slightly by how established the supply is (regular supply vs. occasional/announced).
- Hover a marker: airport name, IATA code, city and country, supply status, and the main suppliers/airlines associated with it.
- Click a marker: opens that country's profile page, same behaviour as clicking the country shape.
- A "SAF airports" toggle in the map's control stack (next to zoom) so the layer can be switched off; it is on by default. Marker size shrinks as you zoom so they never swamp the map.
- Legend gets a SAF-airport entry alongside the existing policy-status colours.

## Notes on the data

The list is curated from published airport, fuel-supplier and airline disclosures, and is indicative rather than exhaustive — the same standard as the other curated datasets on the site. It will carry a source note under the map.

## Technical details

- New `src/lib/saf-airports.ts`: typed array of `{ iata, name, city, country, countrySlug, lat, lon, status: "regular" | "periodic" | "announced", suppliers }`.
- `src/components/WorldPolicyMap.tsx`: project each airport with the existing `geoNaturalEarth1` projection (`projection([lon, lat])`), render markers in the same zoom/pan `<g>` with `strokeWidth`/radius divided by `view.z`; reuse the existing tooltip container for airport hover state; add the layer toggle button and legend chip.
- No backend or data-fetching changes; markers are static and render during SSR.
