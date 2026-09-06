// Sistem moderasi komentar otomatis
class ModerationSystem {
  constructor() {
    this.badWords = [
      'bangsat', 'bajingan', 'kontol', 'memek', 'ngentot',
      'anjing', 'goblok', 'tolol', 'idiot', 'bego',
      'brengsek', 'kampret', 'keparat',
      'fuck', 'shit', 'asshole', 'bitch', 'damn',
      'b4ngs4t', '4nj1ng', 'g0bl0k', 't0l0l', '1d10t'
    ];

    this.spamPatterns = [
      /(.)\1{4,}/g,
      /https?:\/\/\S+/g,
      /\b(?:www\.)\S+/g,
      /[A-Z\s]{20,}/g
    ];

    this.maxLength = 500;
    this.minLength = 2;
  }

  moderate(text) {
    const results = {
      approved: true,
      reasons: [],
      filteredText: text,
      warnings: []
    };

    if (text.length < this.minLength) {
      results.approved = false;
      results.reasons.push('Komentar terlalu pendek');
    }

    if (text.length > this.maxLength) {
      results.approved = false;
      results.reasons.push('Komentar terlalu panjang');
    }

    const lowerText = text.toLowerCase();
    const foundBadWords = this.badWords.filter(word => 
      lowerText.includes(word.toLowerCase())
    );

    if (foundBadWords.length > 0) {
      results.approved = false;
      results.reasons.push(`Mengandung kata tidak pantas: ${foundBadWords.join(', ')}`);
      results.filteredText = this.censorBadWords(text, foundBadWords);
    }

    this.spamPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        results.warnings.push('Terdeteksi pola spam');
        if (pattern === this.spamPatterns[1] || pattern === this.spamPatterns[2]) {
          results.approved = false;
          results.reasons.push('Link tidak diizinkan');
        }
      }
    });

    return results;
  }

  censorBadWords(text, badWords) {
    let censored = text;
    badWords.forEach(word => {
      const regex = new RegExp(word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      censored = censored.replace(regex, '*'.repeat(word.length));
    });
    return censored;
  }

  sanitizeHTML(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async checkWithBackend(text) {
    try {
      const response = await fetch('/api/moderate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      
      if (response.ok) {
        return await response.json();
      }
      
      return this.moderate(text);
    } catch (error) {
      return this.moderate(text);
    }
  }
}

const moderation = new ModerationSystem();
