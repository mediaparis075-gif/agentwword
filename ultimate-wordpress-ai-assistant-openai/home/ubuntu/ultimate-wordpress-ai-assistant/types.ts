export interface Credentials {
  wpUrl: string;
  username: string;
  appPassword: string;
}

export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

export enum Sender {
    User = 'user',
    AI = 'ai'
}

export interface Message {
  id: number;
  text: string;
  sender: Sender;
  timestamp: string;
}

export interface WPCategory {
    id: number;
    name: string;
    slug: string;
    description: string;
    yoast_head_json?: { // For reliably reading title/desc
        title?: string;
        description?: string;
    };
    // Fields exposed by functions.php for writing and for reading focuskw
    _yoast_wpseo_title?: string;
    _yoast_wpseo_metadesc?: string;
    _yoast_wpseo_focuskw?: string;
}
