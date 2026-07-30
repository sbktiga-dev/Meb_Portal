import { NextRequest, NextResponse } from 'next/server';
export const dynamic = 'force-dynamic';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { logActivity } from '@/lib/activity';
import { ROLE_USER, ROLE_COMPANY, ROLE_SUPPLIER, ROLE_MANUFACTURER, ROLE_CLIENT, ROLE_ADMIN } from '@/lib/constants';

const ALLOWED_ROLES = [ROLE_USER, ROLE_COMPANY, ROLE_SUPPLIER, ROLE_MANUFACTURER, ROLE_CLIENT, ROLE_ADMIN];

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    const payload = verifyToken(authHeader.split(' ')[1]);
    if (!payload) return NextResponse.json({ error: 'Невалидный токен' }, { status: 401 });
    const admin = await prisma.user.findUnique({ where: { id: payload.userId }, select: { role: true } });
    if (admin?.role !== ROLE_ADMIN) return NextResponse.json({ error: 'Доступ запрещён' }, { status: 403 });

    if (params.id === payload.userId) {
      return NextResponse.json({ error: 'Нельзя изменить свою роль' }, { status: 400 });
    }

    const { role, specialistType } = await req.json();
    if (!ALLOWED_ROLES.includes(role)) {
      return NextResponse.json({ error: 'Невалидная роль' }, { status: 400 });
    }
    const allowedSpecTypes = ['DESIGNER', 'TECHNOLOGIST', 'INSTALLER', 'MANAGER'];
    if (specialistType && !allowedSpecTypes.includes(specialistType)) {
      return NextResponse.json({ error: 'Невалидная специализация' }, { status: 400 });
    }

    // Загружаем текущие связи пользователя
    const currentUser = await prisma.user.findUnique({
      where: { id: params.id },
      select: { role: true, specialistId: true, companyId: true, supplierId: true, manufacturerId: true },
    });
    if (!currentUser) return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 });

    // Определяем, какие записи нужно удалить при смене роли
    const cleanup: Promise<unknown>[] = [];
    const disconnectData: Record<string, unknown> = { role };

    // Если был SPECIALIST/USER, а новая роль — не SPECIALIST и не USER
    if (['USER', 'SPECIALIST'].includes(currentUser.role) && !['USER', 'SPECIALIST'].includes(role) && currentUser.specialistId) {
      cleanup.push(prisma.specialist.delete({ where: { id: currentUser.specialistId } }));
      disconnectData.specialistId = null;
    }
    // Если был COMPANY, а новая роль — не COMPANY
    if (currentUser.role === 'COMPANY' && role !== 'COMPANY' && currentUser.companyId) {
      cleanup.push(prisma.company.delete({ where: { id: currentUser.companyId } }));
      disconnectData.companyId = null;
    }
    // Если был SUPPLIER, а новая роль — не SUPPLIER
    if (currentUser.role === 'SUPPLIER' && role !== 'SUPPLIER' && currentUser.supplierId) {
      cleanup.push(prisma.supplier.delete({ where: { id: currentUser.supplierId } }));
      disconnectData.supplierId = null;
    }
    // Если был MANUFACTURER, а новая роль — не MANUFACTURER
    if (currentUser.role === 'MANUFACTURER' && role !== 'MANUFACTURER' && currentUser.manufacturerId) {
      cleanup.push(prisma.manufacturer.delete({ where: { id: currentUser.manufacturerId } }));
      disconnectData.manufacturerId = null;
    }

    // Создаём запись при переходе на новую роль-каталог
    if (['USER', 'SPECIALIST'].includes(role) && !currentUser.specialistId) {
      const specialist = await prisma.specialist.create({ data: { type: specialistType || 'DESIGNER' } });
      disconnectData.specialistId = specialist.id;
    } else if (role === 'COMPANY' && !currentUser.companyId) {
      const company = await prisma.company.create({ data: { name: currentUser.role /* placeholder */ } });
      disconnectData.companyId = company.id;
    } else if (role === 'SUPPLIER' && !currentUser.supplierId) {
      const supplier = await prisma.supplier.create({ data: { companyName: '' } });
      disconnectData.supplierId = supplier.id;
    } else if (role === 'MANUFACTURER' && !currentUser.manufacturerId) {
      const manufacturer = await prisma.manufacturer.create({ data: { name: '' } });
      disconnectData.manufacturerId = manufacturer.id;
    }

    // Обновляем специализацию, если указана и пользователь — специалист
    if (specialistType && disconnectData.specialistId) {
      await prisma.specialist.update({ where: { id: disconnectData.specialistId as string }, data: { type: specialistType } });
    }

    // Выполняем очистку и обновление
    await Promise.all(cleanup);
    await prisma.user.update({ where: { id: params.id }, data: disconnectData });

    logActivity({ action: 'role_change', userId: payload.userId, details: `Роль пользователя ${params.id} изменена с ${currentUser.role} на ${role}` });
    return NextResponse.json({ role });
  } catch (error) {
    console.error('Admin role error:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}
