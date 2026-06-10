export default {
  async fetch(request, env) {
    // === CONFIGURATION ===
    const CORRECT_PASSWORD = '2828' // <--- Set your desired password here

    // Using a watercolor background link that matches your homepage aesthetic
    const BACKGROUND_IMAGE_URL =
      'https://images.squarespace-cdn.com/content/v1/5f80b87b7445eb5b23e74be1/1628135891396-K73V8V5C5E6L348M0ZJ0/watercolor-background.jpg'
    // === END CONFIGURATION ===

    const url = new URL(request.url)
    const cookie = request.headers.get('Cookie') || ''

    // 1. Check if the user is already authorized via Cookie
    if (cookie.includes('echo28_auth=true')) {
      // Pages advanced mode: must use ASSETS, not fetch(request) — otherwise Error 1019 (worker recursion).
      return env.ASSETS.fetch(request)
    }

    // 2. Handle the password submission (POST request)
    if (request.method === 'POST') {
      const formData = await request.formData()
      const password = formData.get('password')

      if (password === CORRECT_PASSWORD) {
        // Success: Set an auth cookie valid for 3 days and redirect to home
        return new Response('Success', {
          status: 302,
          headers: {
            'Set-Cookie': `echo28_auth=true; Path=/; HttpOnly; SameSite=Lax; Max-Age=${3 * 24 * 60 * 60}`,
            Location: url.href,
          },
        })
      } else {
        // Failure: Return the login page with an error message
        return new Response(getLoginHTML(BACKGROUND_IMAGE_URL, true), {
          headers: { 'Content-Type': 'text/html;charset=UTF-8' },
        })
      }
    }

    // 3. Default: Serve the password entry page
    return new Response(getLoginHTML(BACKGROUND_IMAGE_URL, false), {
      headers: { 'Content-Type': 'text/html;charset=UTF-8' },
    })
  },
}

// === UI TEMPLATE (Styled for echo28) ===
function getLoginHTML(bgUrl, isError) {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>echo28 - Verification</title>
    <style>
      :root {
        --echo-green: #2ecc71; /* Matches the "Start Your Customized Route" button */
        --echo-dark: #2d3436;  /* Primary text color */
        --echo-text-light: #636e72;
      }
      body { 
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; 
        margin: 0; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        height: 100vh;
        background-image: url('${bgUrl}');
        background-size: cover;
        background-position: center;
        background-repeat: no-repeat;
      }
      .card { 
        background: rgba(255, 255, 255, 0.92); 
        padding: 50px; 
        border-radius: 30px; 
        box-shadow: 0 10px 40px rgba(0,0,0,0.1); 
        width: 100%; 
        max-width: 420px; 
        text-align: center;
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      h1 { 
        color: var(--echo-dark); 
        margin: 0 0 15px 0;
        font-size: 38px; 
        font-weight: 800; 
        letter-spacing: -1px;
      }
      p { 
        color: var(--echo-text-light); 
        margin-bottom: 30px; 
        line-height: 1.6; 
        font-size: 16px;
      }
      input[type="password"] { 
        width: 100%; 
        padding: 14px 20px; 
        border: 1px solid #e2e8f0; 
        border-radius: 12px; 
        background: #f8fafc; 
        font-size: 16px; 
        box-sizing: border-box; 
        margin-bottom: 20px; 
        outline: none; 
        transition: border-color 0.2s;
      }
      input[type="password"]:focus {
        border-color: var(--echo-green);
      }
      button { 
        width: 100%;
        padding: 14px 30px; 
        border: none; 
        border-radius: 50px; /* Pill shape to match your homepage buttons */
        background-color: var(--echo-green); 
        color: white; 
        font-size: 16px; 
        font-weight: 600; 
        cursor: pointer; 
        transition: all 0.2s ease; 
      }
      button:hover { 
        background-color: #27ae60;
        transform: translateY(-1px);
      }
      .error { 
        color: #e53e3e; 
        font-size: 14px; 
        margin-bottom: 15px;
        font-weight: 500;
      }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>echo28</h1>
      <p>Please enter the website password before continuing.</p>
      ${isError ? '<div class="error">Incorrect password. Please try again.</div>' : ''}
      <form method="POST">
        <input type="password" name="password" placeholder="Enter password" required autofocus>
        <button type="submit">Continue</button>
      </form>
    </div>
  </body>
  </html>
  `
}
