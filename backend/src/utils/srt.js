function generateSRT(segments) {
  if (!segments || !Array.isArray(segments) || segments.length === 0) {
    return '';
  }

  let srtContent = '';
  
  segments.forEach((segment, index) => {
    srtContent += `${index + 1}\n`;
    const startTime = secondsToSRTTime(segment.start);
    const endTime = secondsToSRTTime(segment.end);
    srtContent += `${startTime} --> ${endTime}\n`;
    const cleanText = cleanTextForSRT(segment.text);
    srtContent += `${cleanText}\n`;
    srtContent += '\n';
  });

  return srtContent.trim();
}

function generateRemotionCaptions(segments) {
  if (!segments || !Array.isArray(segments)) {
    return [];
  }

  return segments.map((segment, index) => ({
    id: index + 1,
    startTime: Math.round(segment.start * 1000),
    endTime: Math.round(segment.end * 1000),
    text: cleanTextForSRT(segment.text),
    duration: Math.round((segment.end - segment.start) * 1000)
  }));
}

function secondsToSRTTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${hours.toString().padStart(2, '0')}:${minutes
    .toString()
    .padStart(2, '0')}:${secs.toString().padStart(2, '0')},${milliseconds
    .toString()
    .padStart(3, '0')}`;
}

function srtTimeToSeconds(srtTime) {
  const [time, ms] = srtTime.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  return hours * 3600 + minutes * 60 + seconds + parseInt(ms) / 1000;
}

function cleanTextForSRT(text) {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+([.!?])/g, '$1')
    .replace(/([.!?]\s+)([a-z])/g, (match, punct, letter) => punct + letter.toUpperCase())
    .replace(/^[a-z]/, letter => letter.toUpperCase());
}

function parseSRTContent(srtContent) {
  const segments = [];
  const entries = srtContent.trim().split('\n\n');
  
  for (const entry of entries) {
    const lines = entry.split('\n');
    if (lines.length >= 3) {
      const timeMatch = lines[1].match(/(\d{2}:\d{2}:\d{2},\d{3}) --> (\d{2}:\d{2}:\d{2},\d{3})/);
      if (timeMatch) {
        const start = srtTimeToSeconds(timeMatch[1]);
        const end = srtTimeToSeconds(timeMatch[2]);
        const text = lines.slice(2).join('\n').trim();
        
        segments.push({ start, end, text });
      }
    }
  }
  
  return segments;
}

function validateSRT(srtContent) {
  const result = { isValid: true, errors: [] };
  
  if (!srtContent || typeof srtContent !== 'string') {
    result.isValid = false;
    result.errors.push('SRT content is empty or invalid');
    return result;
  }
  
  const segments = parseSRTContent(srtContent);
  
  if (segments.length === 0) {
    result.isValid = false;
    result.errors.push('No valid subtitle entries found');
    return result;
  }
  
  for (let i = 0; i < segments.length - 1; i++) {
    if (segments[i].end > segments[i + 1].start) {
      result.errors.push(`Overlapping timestamps at entry ${i + 1} and ${i + 2}`);
    }
  }
  
  segments.forEach((segment, index) => {
    if (segment.end <= segment.start) {
      result.errors.push(`Invalid duration at entry ${index + 1}`);
    }
  });
  
  if (result.errors.length > 0) {
    result.isValid = false;
  }
  
  return result;
}

module.exports = {
  generateSRT,
  generateRemotionCaptions,
  secondsToSRTTime,
  srtTimeToSeconds,
  cleanTextForSRT,
  parseSRTContent,
  validateSRT
};