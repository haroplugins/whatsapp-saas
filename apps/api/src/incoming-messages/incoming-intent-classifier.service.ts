import { Injectable } from '@nestjs/common';
import {
  type IncomingMessageIntent,
  type IncomingMessageIntentClassification,
  type IncomingMessageIntentConfidence,
} from './incoming-message.types';

type IntentRule = {
  intent: Exclude<IncomingMessageIntent, 'UNKNOWN'>;
  keywords: string[];
};

const intentPriority: IntentRule[] = [
  {
    intent: 'BOOKING_CHANGE',
    keywords: [
      'cancelar cita',
      'cancela',
      'cancelar',
      'cambiar cita',
      'modificar cita',
      'mover cita',
      'anular reserva',
      'cambio de hora',
    ],
  },
  {
    intent: 'BOOKING',
    keywords: [
      'cita',
      'reserva',
      'reservar',
      'hueco',
      'disponibilidad',
      'disponible',
      'quiero venir',
      'puedo venir',
      'manana',
      'tarde',
      'manana por la manana',
      'viernes',
      'sabado',
    ],
  },
  {
    intent: 'PRICING',
    keywords: [
      'precio',
      'precios',
      'cuesta',
      'cuanto cuesta',
      'tarifa',
      'tarifas',
      'vale',
      'coste',
      'presupuesto',
    ],
  },
  {
    intent: 'BUSINESS_HOURS',
    keywords: [
      'horario',
      'horarios',
      'abris',
      'cerrais',
      'abierto',
      'abierta',
      'a que hora',
      'que hora',
      'hora abris',
      'hora cerrais',
    ],
  },
  {
    intent: 'LOCATION',
    keywords: [
      'donde estais',
      'direccion',
      'ubicacion',
      'como llegar',
      'maps',
      'google maps',
    ],
  },
  {
    intent: 'ISSUE',
    keywords: [
      'problema',
      'queja',
      'reclamacion',
      'no funciona',
      'mal',
      'error',
      'urgente',
    ],
  },
  {
    intent: 'GREETING',
    keywords: [
      'hola',
      'buenas',
      'buenos dias',
      'buenas tardes',
      'buenas noches',
      'bon dia',
      'bona tarda',
      'hello',
    ],
  },
];

@Injectable()
export class IncomingIntentClassifierService {
  classify(content: string): IncomingMessageIntentClassification {
    const normalizedContent = normalizeText(content);

    for (const rule of intentPriority) {
      const matchedKeywords = rule.keywords.filter((keyword) => hasKeyword(normalizedContent, keyword));

      if (matchedKeywords.length > 0) {
        return {
          intent: rule.intent,
          confidence: getConfidence(matchedKeywords),
          matchedKeywords,
        };
      }
    }

    return {
      intent: 'UNKNOWN',
      confidence: 'LOW',
      matchedKeywords: [],
    };
  }
}

function getConfidence(matchedKeywords: string[]): IncomingMessageIntentConfidence {
  if (matchedKeywords.some((keyword) => keyword.includes(' ')) || matchedKeywords.length > 1) {
    return 'HIGH';
  }

  return matchedKeywords[0] && matchedKeywords[0].length >= 6 ? 'MEDIUM' : 'LOW';
}

function hasKeyword(normalizedContent: string, keyword: string): boolean {
  const normalizedKeyword = normalizeText(keyword);
  const escapedKeyword = normalizedKeyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escapedKeyword}(?=\\s|$)`, 'u');
  return pattern.test(normalizedContent);
}

function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
