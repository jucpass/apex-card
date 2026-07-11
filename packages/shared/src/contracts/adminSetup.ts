export type CountryDto = {
  id: string;
  name: string;
  code: string;
};

export type CityDto = {
  id: string;
  name: string;
  countryId: string;
};

export type CategoryDto = {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
};

export type CountryInput = {
  name: string;
  code: string;
};

export type CityInput = {
  name: string;
  countryId: string;
};

export type CategoryInput = {
  name: string;
  slug: string;
  icon: string;
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

export type CategoriesResponse = {
  categories: CategoryDto[];
};

export type CategoryResponse = {
  category: CategoryDto;
};
