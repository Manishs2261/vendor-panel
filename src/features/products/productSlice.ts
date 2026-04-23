import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { productApi, categoryApi } from '../../api/services';
import type { Product, Category, ProductForm, ListState } from '../../types';

interface ProductState extends ListState<Product> {
  selected: Product | null;
  selectedIds: string[];
  categories: Category[];
  filters: {
    search: string;
    status: string;
    category_id: string;
    stock_filter: string;
    stock_min: string;
    stock_max: string;
    min_price: string;
    max_price: string;
    discount_only: boolean;
    created_from: string;
    created_to: string;
    updated_from: string;
    updated_to: string;
    sort_by: string;
    page: number;
    limit: number;
  };
}

const initialState: ProductState = {
  items: [], total: 0, page: 1, pages: 0, loading: false, error: null,
  selected: null, selectedIds: [], categories: [],
  filters: {
    search: '', status: '', category_id: '', stock_filter: '',
    stock_min: '', stock_max: '', min_price: '', max_price: '',
    discount_only: false, created_from: '', created_to: '',
    updated_from: '', updated_to: '', sort_by: 'recent',
    page: 1, limit: 10,
  },
};

export const fetchProducts = createAsyncThunk('products/fetchAll', async (_, { getState, rejectWithValue }) => {
  try {
    const { filters } = (getState() as any).products;
    const { data } = await productApi.list(filters);
    return data;
  } catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Failed to fetch products'); }
});

export const fetchCategories = createAsyncThunk('products/fetchCategories', async (_, { rejectWithValue }) => {
  try { const { data } = await categoryApi.list(); return data; }
  catch (err: any) { return rejectWithValue('Failed to fetch categories'); }
});

export const createProduct = createAsyncThunk(
  'products/create',
  async ({ form, images, video }: { form: ProductForm; images: File[]; video?: File }, { rejectWithValue }) => {
    try { const { data } = await productApi.create(form, images, video); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Failed to create product'); }
  }
);

export const updateProduct = createAsyncThunk(
  'products/update',
  async ({ id, form, newImages, video }: { id: string; form: Partial<ProductForm>; newImages?: File[]; video?: File }, { rejectWithValue }) => {
    try { const { data } = await productApi.update(id, form, newImages, video); return data; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Failed to update product'); }
  }
);

export const deleteProduct = createAsyncThunk('products/delete', async (id: string, { rejectWithValue }) => {
  try { await productApi.delete(id); return id; }
  catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Failed to delete'); }
});

export const bulkDeleteProducts = createAsyncThunk('products/bulkDelete', async (ids: string[], { rejectWithValue }) => {
  try { await productApi.bulkDelete(ids); return ids; }
  catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Bulk delete failed'); }
});

export const bulkStatusUpdate = createAsyncThunk(
  'products/bulkStatus',
  async ({ ids, status }: { ids: string[]; status: 'ACTIVE' | 'INACTIVE' }, { rejectWithValue }) => {
    try { await productApi.bulkStatusUpdate(ids, status); return { ids, status }; }
    catch (err: any) { return rejectWithValue(err.response?.data?.detail || err.response?.data?.message || 'Bulk update failed'); }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    setFilter(state, action) { state.filters = { ...state.filters, ...action.payload, page: 1 }; },
    setPage(state, action) { state.filters.page = action.payload; },
    selectId(state, action) {
      const id = action.payload;
      state.selectedIds = state.selectedIds.includes(id)
        ? state.selectedIds.filter(i => i !== id)
        : [...state.selectedIds, id];
    },
    selectAll(state) {
      state.selectedIds = state.selectedIds.length === state.items.length ? [] : state.items.map(p => p.id);
    },
    clearSelected(state) { state.selectedIds = []; },
    setSelected(state, action) { state.selected = action.payload; },
    clearError(state) { state.error = null; },
    resetFilters(state) {
      state.filters = {
        search: '', status: '', category_id: '', stock_filter: '',
        stock_min: '', stock_max: '', min_price: '', max_price: '',
        discount_only: false, created_from: '', created_to: '',
        updated_from: '', updated_to: '', sort_by: 'recent',
        page: 1, limit: state.filters.limit,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => { state.loading = true; state.error = null; })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.items;
        state.total = action.payload.total;
        state.pages = action.payload.pages;
        state.page = action.payload.page;
      })
      .addCase(fetchProducts.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(fetchCategories.fulfilled, (state, action) => { state.categories = action.payload; })

      .addCase(createProduct.pending, (state) => { state.loading = true; })
      .addCase(createProduct.fulfilled, (state, action) => { state.loading = false; state.items.unshift(action.payload); state.total += 1; })
      .addCase(createProduct.rejected, (state, action) => { state.loading = false; state.error = action.payload as string; })

      .addCase(updateProduct.fulfilled, (state, action) => {
        state.loading = false;
        const idx = state.items.findIndex(p => p.id === action.payload.id);
        if (idx !== -1) state.items[idx] = action.payload;
        if (state.selected?.id === action.payload.id) state.selected = action.payload;
      })

      .addCase(deleteProduct.fulfilled, (state, action) => {
        state.items = state.items.filter(p => p.id !== action.payload);
        state.total -= 1;
      })

      .addCase(bulkDeleteProducts.fulfilled, (state, action) => {
        state.items = state.items.filter(p => !action.payload.includes(p.id));
        state.total -= action.payload.length;
        state.selectedIds = [];
      })

      .addCase(bulkStatusUpdate.fulfilled, (state, action) => {
        const { ids, status } = action.payload;
        state.items = state.items.map(p => ids.includes(p.id) ? { ...p, status } : p);
        state.selectedIds = [];
      });
  },
});

export const { setFilter, setPage, selectId, selectAll, clearSelected, setSelected, clearError, resetFilters } = productSlice.actions;
export default productSlice.reducer;
