import CategoryEditor from '@/components/admin/CategoryEditor';
import { CategoryService } from '@/services/categoryService';
export default async function EditCat({ params }: { params: { id: string } }) {
  const cat = await CategoryService.getById(params.id);
  return <CategoryEditor initialData={cat} />;
}