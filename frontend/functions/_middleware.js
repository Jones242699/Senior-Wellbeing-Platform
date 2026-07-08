export async function onRequest(context) {
    const { request, next } = context;
    const url = new URL(request.url);

    // 1. set up password
    const CORRECT_PASSWORD = "jones13579";
    const COOKIE_NAME = "site_auth_token";

    // 2. if user is submitting password form
    if (request.method === "POST" && url.pathname === "/_auth") {
        const formData = await request.formData();
        const password = formData.get("password");

        if (password === CORRECT_PASSWORD) {
            // password correct, set cookie and redirect to home page
            return new Response("password correct, redirecting to home page...", {
                status: 302,
                headers: {
                    "Location": "/",
                    "Set-Cookie": `${COOKIE_NAME}=true; Path=/; HttpOnly; Secure; Max-Age=86400`,
                },
            });
        } else {
            // password incorrect, return hint
            return new Response("password incorrect, please refresh the page and try again.", { status: 403 });
        }
    }

    // 3. check if user browser has correct cookie
    const cookieHeader = request.headers.get("Cookie") || "";
    if (cookieHeader.includes(`${COOKIE_NAME}=true`)) {
        // already logged in, allow access to the website
        return next();
    }

    // 4. if user is not logged in and not submitting password form, block access and show password input page
    const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Website Maintenance - Please Enter Password</title>
      <style>
        body { font-family: -apple-system, sans-serif; background: #f3f4f6; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }
        .card { background: white; padding: 2.5rem; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); text-align: center; width: 100%; max-width: 360px; }
        h2 { color: #1f2937; margin-bottom: 0.5rem; font-size: 1.5rem; }
        p { color: #6b7280; font-size: 0.875rem; margin-bottom: 2rem; }
        input[type="password"] { width: 100%; padding: 0.75rem; border: 1px solid #d1d5db; border-radius: 6px; box-sizing: border-box; font-size: 1rem; margin-bottom: 1rem; }
        button { width: 100%; padding: 0.75rem; background: #2563eb; color: white; border: none; border-radius: 6px; font-size: 1rem; cursor: pointer; font-weight: 500; }
        button:hover { background: #1d4ed8; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>🔒 Access Denied</h2>
        <p>This website is undergoing maintenance, please enter password to access.</p>
        <form action="/_auth" method="POST">
          <input type="password" name="password" placeholder="请输入密码" required autofocus>
          <button type="submit">Enter Website</button>
        </form>
      </div>
    </body>
    </html>
  `;

    return new Response(html, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
    });
}