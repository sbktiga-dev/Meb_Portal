const BASE = 'http://127.0.0.1:3099';

async function test() {
  const loginRes = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'admin@mebportal.ru', password: 'admin123' }),
  });
  const loginData = await loginRes.json();
  console.log('LOGIN:', loginRes.status, loginData.error || 'OK');
  if (!loginData.token) return;
  const token = loginData.token;

  const postsRes = await fetch(`${BASE}/api/posts?limit=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const postsData = await postsRes.json();
  console.log('POSTS:', postsRes.status, postsData.posts?.length || 0);

  if (postsData.posts?.length > 0) {
    const postId = postsData.posts[0].id;
    const likeRes = await fetch(`${BASE}/api/posts/${postId}/like`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const likeData = await likeRes.json();
    console.log('LIKE:', likeRes.status, JSON.stringify(likeData));

    const postRes = await fetch(`${BASE}/api/posts/${postId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const postData = await postRes.json();
    console.log('POST GET:', postRes.status, 'liked:', postData.liked, 'views:', postData.post?.views);
  }

  const eventsRes = await fetch(`${BASE}/api/events?limit=1`);
  const eventsData = await eventsRes.json();
  console.log('EVENTS:', eventsRes.status, eventsData.events?.length || 0);

  if (eventsData.events?.length > 0) {
    const eventId = eventsData.events[0].id;
    const joinRes = await fetch(`${BASE}/api/events/${eventId}/join`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const joinData = await joinRes.json();
    console.log('JOIN:', joinRes.status, JSON.stringify(joinData));
  }
}

test().catch(e => console.error('ERR:', e.message));
