export type ServiceResolutionStatus =
  | 'MATCHED'
  | 'MULTIPLE_MATCHES'
  | 'NOT_FOUND'
  | 'MISSING';

export type DateResolutionStatus = 'RESOLVED' | 'MISSING' | 'UNSUPPORTED';

export type TimePreferenceValue =
  | 'MORNING'
  | 'AFTERNOON'
  | 'EVENING'
  | 'ANY'
  | 'UNKNOWN';

export type TimePreferenceStatus = 'RESOLVED' | 'MISSING' | 'UNKNOWN';

export type ResolutionConfidence = 'high' | 'medium' | 'low';

export type ServiceResolutionCandidate = {
  serviceId: string;
  serviceName: string;
  matchedBy: 'name' | 'token';
  confidence: ResolutionConfidence;
};

export type ServiceResolution =
  | {
      status: 'MATCHED';
      serviceId: string;
      serviceName: string;
      matchedBy: 'name' | 'token';
      confidence: ResolutionConfidence;
    }
  | {
      status: 'MULTIPLE_MATCHES';
      candidates: ServiceResolutionCandidate[];
    }
  | {
      status: 'NOT_FOUND' | 'MISSING';
    };

export type DateResolution =
  | {
      status: 'RESOLVED';
      date: string;
      source: string;
      timezone: string;
    }
  | {
      status: 'MISSING' | 'UNSUPPORTED';
      timezone: string;
      source?: string;
    };

export type TimePreferenceResolution =
  | {
      status: 'RESOLVED';
      value: TimePreferenceValue;
      source: string;
    }
  | {
      status: 'MISSING' | 'UNKNOWN';
      value: 'UNKNOWN';
      source?: string;
    };

export type BookingResolutionResult = {
  input: {
    text: string;
  };
  serviceResolution: ServiceResolution;
  dateResolution: DateResolution;
  timePreference: TimePreferenceResolution;
  missingFields: string[];
  readyForAvailabilitySearch: boolean;
  shouldCheckAvailability: false;
  shouldCreateAppointment: false;
  shouldSendMessage: false;
};
