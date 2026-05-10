// API endpoint для логирования активности
// POST /api/log

export default async function handler(req, res) {
  // Разрешаем CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method not allowed' });
  }
  
  try {
    const logData = req.body;
    
    if (!logData.adId) {
      return res.status(400).json({ ok: false, error: 'No adId provided' });
    }
    
    // Получаем URL webhook сервера из переменных окружения
    const webhookBase = process.env.WEBHOOK_URL || 'https://arboricultural-roselia-unsolvably.ngrok-free.dev';
    const webhookUrl = webhookBase + '/api/log';
    
    // Пересылаем данные на webhook сервер бота
    try {
      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(logData),
      });
      
      console.log(`Log forwarded to webhook: ${response.status}`);
    } catch (error) {
      console.error('Warning: Could not forward log to webhook:', error.message);
      // Не возвращаем ошибку клиенту, просто логируем
    }
    
    // Возвращаем успех клиенту
    res.status(200).json({ ok: true, status: 'logged' });
  } catch (error) {
    console.error('Error processing log:', error);
    res.status(500).json({ ok: false, error: error.message });
  }
}
