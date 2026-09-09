// Cloudflare Worker - TUTED CORS Proxy
// Deploy this at: https://dash.cloudflare.com/workers
// Free tier: 100,000 requests/day

export default {
  async fetch(request) {
    // Only allow GET requests
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        }
      });
    }

    const url = new URL(request.url);
    
    // Build target URL: everything after /proxy/ is the target
    const targetPath = url.pathname.replace('/proxy/', '');
    const search = url.search;
    const targetUrl = 'https://antalyatuted.org.tr/' + targetPath + search;

    try {
      const response = await fetch(targetUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'tr-TR,tr;q=0.9,en;q=0.8',
        }
      });

      const body = await response.arrayBuffer();
      
      return new Response(body, {
        status: response.status,
        headers: {
          'Content-Type': response.headers.get('Content-Type') || 'application/octet-stream',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
        }
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        }
      });
    }
  }
};
