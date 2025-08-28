import { Credentials, WPCategory } from '../types';

function getAuthHeader(credentials: Credentials): string {
  return 'Basic ' + btoa(`${credentials.username}:${credentials.appPassword}`);
}

async function apiFetch<T,>(url: string, options: RequestInit): Promise<T> {
  const response = await fetch(url, options);
  if (!response.ok) {
    const errorBody = await response.text();
    console.error("API Fetch Error Body:", errorBody);
    throw new Error(`WordPress API request failed: ${response.statusText}`);
  }
  const text = await response.text();
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export const validateWpConnection = async (credentials: Credentials): Promise<boolean> => {
  try {
    const url = `${credentials.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/users/me?context=edit`;
    await apiFetch(url, {
      method: 'GET',
      headers: {
        'Authorization': getAuthHeader(credentials),
        'Content-Type': 'application/json',
      },
    });
    return true;
  } catch (error) {
    console.error("WordPress connection validation failed:", error);
    return false;
  }
};

export const getCategories = async (credentials: Credentials): Promise<WPCategory[]> => {
  const url = `${credentials.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/product_cat?per_page=100&context=edit`;
  return apiFetch<WPCategory[]>(url, {
    method: 'GET',
    headers: {
      'Authorization': getAuthHeader(credentials),
      'Content-Type': 'application/json',
    },
  });
};

export const getCategoryByName = async (credentials: Credentials, name: string): Promise<WPCategory | null> => {
    try {
        const searchUrl = `${credentials.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/product_cat?search=${encodeURIComponent(name)}`;
        const categories = await apiFetch<WPCategory[]>(searchUrl, {
            method: 'GET',
            headers: {
                'Authorization': getAuthHeader(credentials),
                'Content-Type': 'application/json',
            },
        });
        
        const foundCategory = categories.find(cat => cat.name.toLowerCase() === name.toLowerCase());

        if (!foundCategory) {
          return null;
        }

        // Now fetch the full category object to get all meta fields
        const categoryUrl = `${credentials.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/product_cat/${foundCategory.id}?context=edit`;
        const categoryWithMeta = await apiFetch<WPCategory>(categoryUrl, {
           method: 'GET',
            headers: {
                'Authorization': getAuthHeader(credentials),
                'Content-Type': 'application/json',
            },
        });

        // The functions.php snippet should have populated the meta object directly.
        return categoryWithMeta;

    } catch (error) {
        console.error(`Failed to get category by name '${name}':`, error);
        return null;
    }
}

export const updateCategoryMetadata = async (
  credentials: Credentials, 
  categoryId: number, 
  data: Partial<WPCategory>
): Promise<WPCategory> => {
  const url = `${credentials.wpUrl.replace(/\/$/, '')}/wp-json/wp/v2/product_cat/${categoryId}`;
  
  return apiFetch<WPCategory>(url, {
    method: 'POST',
    headers: {
      'Authorization': getAuthHeader(credentials),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });
};
