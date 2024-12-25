export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const email = request.headers.get("cf-access-authenticated-user-email");
    if (!email) {
      return new Response("User not authenticated", { status: 401 });
    }

    if (path.startsWith('/secure')) {
      const countryMatch = path.match(/^\/secure\/([^/]+)$/);

      if (countryMatch) {
        // Handle /secure/${COUNTRY}
        const country = countryMatch[1];
        const flagKey = `${country.toLowerCase()}.png`;

        try {
          const object = await env.FLAGS_BUCKET.get(flagKey);
          if (!object) {
            return new Response("Flag not found", { status: 404 });
          }

          return new Response(object.body, {
            headers: { 'Content-Type': 'image/png' },
          });
        } catch (error) {
          return new Response("Error fetching flag", { status: 500 });
        }
      } else {

        const geo = request.cf || {};
        const timestamp = new Date().toISOString();
        const country = geo.country || "Unknown";

        const responseHTML = `
          <!DOCTYPE html>
          <html>
          <head><title>Secure</title></head>
          <body>
            <p>${email} authenticated at ${timestamp} from 
              <a href="/secure/${country}">${country}</a>
            </p>
          </body>
          </html>
        `;

        return new Response(responseHTML, {
          headers: { 'Content-Type': 'text/html' },
        });
      }
    }

    return new Response("Not Found", { status: 404 });
  },
};
