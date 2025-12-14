const axios = require('axios');

/**
 * Serviço de Geolocalização
 * Integração com Google Maps API
 */
class MapsService {
  constructor() {
    this.apiKey = process.env.GOOGLE_MAPS_API_KEY;
    this.baseUrl = 'https://maps.googleapis.com/maps/api';

    if (!this.apiKey) {
      console.warn('Google Maps API Key não configurado');
    }
  }

  /**
   * Verificar se a API está configurada
   */
  isConfigured() {
    return !!this.apiKey;
  }

  // ============================================================================
  // GEOCODING
  // ============================================================================

  /**
   * Converter endereço em coordenadas (Geocoding)
   * @param {string} address - Endereço completo
   * @returns {Object} Coordenadas e informações do local
   */
  async geocode(address) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          address: address,
          key: this.apiKey,
          language: 'pt-BR',
          region: 'br',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Geocoding error: ${response.data.status}`);
      }

      const result = response.data.results[0];

      return {
        success: true,
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        placeId: result.place_id,
        addressComponents: result.address_components,
        types: result.types,
      };
    } catch (error) {
      console.error('Erro no geocoding:', error);
      throw new Error(`Erro ao geocodificar endereço: ${error.message}`);
    }
  }

  /**
   * Converter coordenadas em endereço (Reverse Geocoding)
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {Object} Informações do endereço
   */
  async reverseGeocode(lat, lng) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const response = await axios.get(`${this.baseUrl}/geocode/json`, {
        params: {
          latlng: `${lat},${lng}`,
          key: this.apiKey,
          language: 'pt-BR',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Reverse geocoding error: ${response.data.status}`);
      }

      const result = response.data.results[0];

      return {
        success: true,
        formattedAddress: result.formatted_address,
        placeId: result.place_id,
        addressComponents: result.address_components,
        types: result.types,
      };
    } catch (error) {
      console.error('Erro no reverse geocoding:', error);
      throw new Error(`Erro ao obter endereço: ${error.message}`);
    }
  }

  /**
   * Buscar CEP e obter informações
   * @param {string} cep - CEP (apenas números)
   * @returns {Object} Informações do CEP
   */
  async searchCep(cep) {
    try {
      // Remover caracteres não numéricos
      const cleanCep = cep.replace(/\D/g, '');

      if (cleanCep.length !== 8) {
        throw new Error('CEP inválido');
      }

      // Usar ViaCEP (API brasileira gratuita) como primeira opção
      try {
        const viaCepResponse = await axios.get(
          `https://viacep.com.br/ws/${cleanCep}/json/`
        );

        if (!viaCepResponse.data.erro) {
          const data = viaCepResponse.data;

          // Se Google Maps configurado, obter coordenadas
          let location = null;
          if (this.isConfigured()) {
            try {
              const fullAddress = `${data.logradouro}, ${data.bairro}, ${data.localidade} - ${data.uf}, ${cleanCep}`;
              const geocodeResult = await this.geocode(fullAddress);
              location = geocodeResult.location;
            } catch (e) {
              console.warn('Não foi possível geocodificar o CEP');
            }
          }

          return {
            success: true,
            cep: data.cep,
            street: data.logradouro,
            complement: data.complemento,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf,
            ibge: data.ibge,
            gia: data.gia,
            ddd: data.ddd,
            siafi: data.siafi,
            location,
          };
        }
      } catch (viaCepError) {
        console.warn('ViaCEP falhou, tentando Google Maps...');
      }

      // Fallback para Google Maps
      if (this.isConfigured()) {
        const geocodeResult = await this.geocode(cleanCep + ', Brasil');
        return {
          success: true,
          formattedAddress: geocodeResult.formattedAddress,
          location: geocodeResult.location,
        };
      }

      throw new Error('CEP não encontrado');
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
      throw new Error(`Erro ao buscar CEP: ${error.message}`);
    }
  }

  // ============================================================================
  // AUTOCOMPLETE
  // ============================================================================

  /**
   * Autocomplete de endereços
   * @param {string} input - Texto digitado pelo usuário
   * @param {Object} options - Opções de busca
   * @returns {Array} Lista de sugestões
   */
  async autocomplete(input, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const { types = 'address', components = 'country:br', location, radius } = options;

      const params = {
        input,
        key: this.apiKey,
        language: 'pt-BR',
        types,
        components,
      };

      if (location && radius) {
        params.location = `${location.lat},${location.lng}`;
        params.radius = radius;
      }

      const response = await axios.get(`${this.baseUrl}/place/autocomplete/json`, {
        params,
      });

      if (response.data.status !== 'OK' && response.data.status !== 'ZERO_RESULTS') {
        throw new Error(`Autocomplete error: ${response.data.status}`);
      }

      return {
        success: true,
        predictions: response.data.predictions.map((prediction) => ({
          placeId: prediction.place_id,
          description: prediction.description,
          mainText: prediction.structured_formatting.main_text,
          secondaryText: prediction.structured_formatting.secondary_text,
          types: prediction.types,
        })),
      };
    } catch (error) {
      console.error('Erro no autocomplete:', error);
      throw new Error(`Erro no autocomplete: ${error.message}`);
    }
  }

  /**
   * Obter detalhes de um lugar pelo Place ID
   * @param {string} placeId - ID do lugar
   * @returns {Object} Detalhes do lugar
   */
  async getPlaceDetails(placeId) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const response = await axios.get(`${this.baseUrl}/place/details/json`, {
        params: {
          place_id: placeId,
          key: this.apiKey,
          language: 'pt-BR',
          fields: 'address_components,formatted_address,geometry,name,place_id',
        },
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Place details error: ${response.data.status}`);
      }

      const result = response.data.result;

      return {
        success: true,
        placeId: result.place_id,
        name: result.name,
        formattedAddress: result.formatted_address,
        location: {
          lat: result.geometry.location.lat,
          lng: result.geometry.location.lng,
        },
        addressComponents: result.address_components,
      };
    } catch (error) {
      console.error('Erro ao obter detalhes do lugar:', error);
      throw new Error(`Erro ao obter detalhes: ${error.message}`);
    }
  }

  // ============================================================================
  // DISTANCE MATRIX
  // ============================================================================

  /**
   * Calcular distância e tempo entre dois pontos
   * @param {Object} origin - Origem (lat/lng ou endereço)
   * @param {Object} destination - Destino (lat/lng ou endereço)
   * @param {Object} options - Opções (mode, avoid, etc.)
   * @returns {Object} Distância e tempo
   */
  async calculateDistance(origin, destination, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const { mode = 'driving', avoid = '', units = 'metric' } = options;

      // Converter origem e destino para string
      const originStr =
        typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`;
      const destinationStr =
        typeof destination === 'string'
          ? destination
          : `${destination.lat},${destination.lng}`;

      const params = {
        origins: originStr,
        destinations: destinationStr,
        key: this.apiKey,
        mode,
        units,
        language: 'pt-BR',
      };

      if (avoid) {
        params.avoid = avoid;
      }

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params,
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Distance matrix error: ${response.data.status}`);
      }

      const element = response.data.rows[0].elements[0];

      if (element.status !== 'OK') {
        throw new Error(`Route not found: ${element.status}`);
      }

      return {
        success: true,
        distance: {
          value: element.distance.value, // em metros
          text: element.distance.text,
        },
        duration: {
          value: element.duration.value, // em segundos
          text: element.duration.text,
        },
        origin: response.data.origin_addresses[0],
        destination: response.data.destination_addresses[0],
      };
    } catch (error) {
      console.error('Erro ao calcular distância:', error);
      throw new Error(`Erro ao calcular distância: ${error.message}`);
    }
  }

  /**
   * Calcular distância entre múltiplos pontos
   * @param {Array} origins - Array de origens
   * @param {Array} destinations - Array de destinos
   * @param {Object} options - Opções
   * @returns {Object} Matriz de distâncias
   */
  async calculateDistanceMatrix(origins, destinations, options = {}) {
    try {
      if (!this.isConfigured()) {
        throw new Error('Google Maps API não configurado');
      }

      const { mode = 'driving', avoid = '', units = 'metric' } = options;

      // Converter origens e destinos para string
      const originsStr = origins
        .map((o) => (typeof o === 'string' ? o : `${o.lat},${o.lng}`))
        .join('|');
      const destinationsStr = destinations
        .map((d) => (typeof d === 'string' ? d : `${d.lat},${d.lng}`))
        .join('|');

      const params = {
        origins: originsStr,
        destinations: destinationsStr,
        key: this.apiKey,
        mode,
        units,
        language: 'pt-BR',
      };

      if (avoid) {
        params.avoid = avoid;
      }

      const response = await axios.get(`${this.baseUrl}/distancematrix/json`, {
        params,
      });

      if (response.data.status !== 'OK') {
        throw new Error(`Distance matrix error: ${response.data.status}`);
      }

      return {
        success: true,
        originAddresses: response.data.origin_addresses,
        destinationAddresses: response.data.destination_addresses,
        rows: response.data.rows.map((row) => ({
          elements: row.elements.map((element) => {
            if (element.status !== 'OK') {
              return { status: element.status };
            }
            return {
              distance: {
                value: element.distance.value,
                text: element.distance.text,
              },
              duration: {
                value: element.duration.value,
                text: element.duration.text,
              },
              status: 'OK',
            };
          }),
        })),
      };
    } catch (error) {
      console.error('Erro ao calcular matriz de distâncias:', error);
      throw new Error(`Erro ao calcular distâncias: ${error.message}`);
    }
  }

  // ============================================================================
  // UTILIDADES
  // ============================================================================

  /**
   * Validar coordenadas
   * @param {number} lat - Latitude
   * @param {number} lng - Longitude
   * @returns {boolean} Válido ou não
   */
  validateCoordinates(lat, lng) {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  /**
   * Calcular distância entre dois pontos usando Haversine (sem API)
   * @param {Object} point1 - {lat, lng}
   * @param {Object} point2 - {lat, lng}
   * @returns {number} Distância em metros
   */
  haversineDistance(point1, point2) {
    const R = 6371e3; // Raio da Terra em metros
    const φ1 = (point1.lat * Math.PI) / 180;
    const φ2 = (point2.lat * Math.PI) / 180;
    const Δφ = ((point2.lat - point1.lat) * Math.PI) / 180;
    const Δλ = ((point2.lng - point1.lng) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // em metros
  }
}

module.exports = new MapsService();
