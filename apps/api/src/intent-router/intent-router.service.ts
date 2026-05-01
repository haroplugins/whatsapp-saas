import { Injectable } from '@nestjs/common';
import { intentRules } from './intent-router.rules';
import type { ClassifiedIntent } from './intent-router.types';

const bookingActionWords = ['quiero', 'necesito', 'pedir', 'reservar'];
const bookingCancelWords = [
  'cancelar',
  'cancela',
  'anular',
  'anula',
  'anulacion',
  'no puedo venir',
  'no podre venir',
  'no puedo asistir',
];
const bookingChangeWords = [
  'cambiar',
  'mover',
  'modificar',
  'aplazar',
  'reprogramar',
  'pasar',
  'pasamela',
];
const bookingTimeWords = [
  'manana',
  'viernes',
  'sabado',
  'domingo',
  'tarde',
  'manana por la manana',
];
const bookingNouns = ['cita', 'hora', 'reserva'];
const availabilityWords = ['hueco', 'libre'];
const priceWords = ['precio', 'cuesta', 'vale'];
const hoursWords = ['horario', 'abris', 'cerrais'];

@Injectable()
export class IntentRouterService {
  classify(text: string): ClassifiedIntent {
    const normalizedText = normalizeText(text);

    for (const rule of intentRules) {
      const matchedPhrase = rule.phrases.find((phrase) =>
        hasPhrase(normalizedText, phrase),
      );

      if (matchedPhrase) {
        return {
          intent: rule.intent,
          confidence: 'high',
          matchedRule: `${rule.key}:${normalizeText(matchedPhrase)}`,
          normalizedText,
        };
      }
    }

    const mediumMatch = classifyByKeywordCombination(normalizedText);

    if (mediumMatch) {
      return {
        ...mediumMatch,
        confidence: 'medium',
        normalizedText,
      };
    }

    return {
      intent: 'UNKNOWN',
      confidence: 'low',
      normalizedText,
    };
  }
}

function classifyByKeywordCombination(
  normalizedText: string,
): Pick<ClassifiedIntent, 'intent' | 'matchedRule'> | null {
  const bookingNoun = findWord(normalizedText, bookingNouns);
  const bookingCancel = findWord(normalizedText, bookingCancelWords);
  const bookingChange = findWord(normalizedText, bookingChangeWords);
  const bookingAction = findWord(normalizedText, bookingActionWords);
  const bookingTime = findWord(normalizedText, bookingTimeWords);
  const availability = findWord(normalizedText, availabilityWords);

  if (bookingCancel && bookingNoun) {
    return {
      intent: 'BOOKING_CANCEL',
      matchedRule: `booking_cancel:keywords:${bookingCancel}+${bookingNoun}`,
    };
  }

  if (bookingChange && bookingNoun) {
    return {
      intent: 'BOOKING_CHANGE',
      matchedRule: `booking_change:keywords:${bookingChange}+${bookingNoun}`,
    };
  }

  if (bookingNoun && bookingAction) {
    return {
      intent: 'BOOKING_REQUEST',
      matchedRule: `booking_request:keywords:${bookingNoun}+${bookingAction}`,
    };
  }

  if (availability) {
    return {
      intent: 'BOOKING_REQUEST',
      matchedRule: `booking_request:keywords:${availability}`,
    };
  }

  if (bookingNoun && bookingTime) {
    return {
      intent: 'BOOKING_REQUEST',
      matchedRule: `booking_request:keywords:${bookingNoun}+${bookingTime}`,
    };
  }

  const priceWord = findWord(normalizedText, priceWords);

  if (priceWord) {
    return {
      intent: 'PRICE_REQUEST',
      matchedRule: `price_request:keywords:${priceWord}`,
    };
  }

  const hoursWord = findWord(normalizedText, hoursWords);

  if (hoursWord) {
    return {
      intent: 'HOURS_REQUEST',
      matchedRule: `hours_request:keywords:${hoursWord}`,
    };
  }

  return null;
}

function findWord(normalizedText: string, words: string[]): string | undefined {
  return words.find((word) => hasPhrase(normalizedText, word));
}

function hasPhrase(normalizedText: string, phrase: string): boolean {
  const normalizedPhrase = normalizeText(phrase);

  if (!normalizedPhrase) {
    return false;
  }

  const escapedPhrase = normalizedPhrase.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(`(^|\\s)${escapedPhrase}(?=\\s|$)`, 'u');
  return pattern.test(normalizedText);
}

export function normalizeText(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
