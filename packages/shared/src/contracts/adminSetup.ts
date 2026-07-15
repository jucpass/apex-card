export type CountryDto = {
  id: string;
  name: string;
  code: string;
  /** International calling prefix (e.g. "+351") — used to prefill Partner phone/WhatsApp. */
  phoneCode: string | null;
};

export type CityDto = {
  id: string;
  name: string;
  countryId: string;
};

export type CountriesResponse = {
  countries: CountryDto[];
};

export type CountryResponse = {
  country: CountryDto;
};

export type CitiesResponse = {
  cities: CityDto[];
};

export type CityResponse = {
  city: CityDto;
};
