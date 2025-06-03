import { PrismaClient, FoodType } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始种子数据...')

  // 清空现有数据
  await prisma.food.deleteMany()
  
  // 菜品数据
  const dishes = [
    // 中餐
    { name: '红烧肉', category: '家常菜', description: '肥瘦相间，香甜软糯', tags: ['甜', '荤菜'] },
    { name: '宫保鸡丁', category: '川菜', description: '酸甜微辣，鸡肉嫩滑', tags: ['辣', '荤菜'] },
    { name: '麻婆豆腐', category: '川菜', description: '麻辣鲜香，嫩滑爽口', tags: ['辣', '麻', '素菜'] },
    { name: '糖醋里脊', category: '家常菜', description: '酸甜可口，外酥内嫩', tags: ['甜', '酸', '荤菜'] },
    { name: '回锅肉', category: '川菜', description: '肥而不腻，香辣下饭', tags: ['辣', '荤菜'] },
    { name: '鱼香肉丝', category: '川菜', description: '酸甜微辣，下饭神器', tags: ['酸', '甜', '辣'] },
    { name: '白切鸡', category: '粤菜', description: '清淡鲜美，原汁原味', tags: ['清淡', '荤菜'] },
    { name: '蒸蛋羹', category: '家常菜', description: '嫩滑如丝，营养丰富', tags: ['清淡', '嫩滑'] },
    { name: '西红柿鸡蛋', category: '家常菜', description: '酸甜开胃，简单美味', tags: ['酸', '甜', '家常'] },
    { name: '青椒肉丝', category: '家常菜', description: '清香爽脆，营养均衡', tags: ['清淡', '荤菜'] },
    
    // 面食
    { name: '兰州拉面', category: '面食', description: '汤清面白，香气扑鼻', tags: ['清汤', '面条'] },
    { name: '重庆小面', category: '面食', description: '麻辣鲜香，重庆特色', tags: ['辣', '麻', '面条'] },
    { name: '炸酱面', category: '面食', description: '酱香浓郁，老北京味道', tags: ['咸香', '面条'] },
    { name: '担担面', category: '川菜', description: '麻辣鲜美，四川名面', tags: ['辣', '麻', '面条'] },
    { name: '热干面', category: '面食', description: '武汉特色，芝麻香浓', tags: ['香', '面条'] },
    
    // 快餐外卖
    { name: '麦当劳巨无霸', category: '快餐', description: '经典汉堡，双层牛肉', tags: ['快餐', '汉堡'] },
    { name: '肯德基炸鸡', category: '快餐', description: '香脆多汁，秘制配方', tags: ['快餐', '炸鸡'] },
    { name: '必胜客披萨', category: '快餐', description: '芝士拉丝，意式风味', tags: ['快餐', '披萨'] },
    { name: '黄焖鸡米饭', category: '快餐', description: '鸡肉软烂，汤汁浓郁', tags: ['快餐', '盖饭'] },
    { name: '沙县小吃', category: '快餐', description: '实惠美味，全国连锁', tags: ['快餐', '小吃'] },
    { name: '兰州拉面', category: '快餐', description: '清汤牛肉，西北风味', tags: ['快餐', '面条'] },
    { name: '煲仔饭', category: '快餐', description: '米饭香糯，配菜丰富', tags: ['快餐', '米饭'] },
    { name: '盖浇饭', category: '快餐', description: '菜品丰富，经济实惠', tags: ['快餐', '盖饭'] },
    
    // 地方特色
    { name: '北京烤鸭', category: '京菜', description: '皮脆肉嫩，京城名菜', tags: ['烤制', '荤菜'] },
    { name: '东坡肉', category: '浙菜', description: '肥而不腻，入口即化', tags: ['甜', '荤菜'] },
    { name: '水煮鱼', category: '川菜', description: '麻辣鲜香，鱼肉嫩滑', tags: ['辣', '麻', '荤菜'] },
    { name: '小笼包', category: '江南小吃', description: '皮薄汁多，鲜美可口', tags: ['鲜', '小吃'] },
    { name: '煎饼果子', category: '天津小吃', description: '香脆可口，街头美食', tags: ['香脆', '小吃'] },
  ]

  // 饮品数据
  const drinks = [
    // 奶茶
    { name: '珍珠奶茶', category: '奶茶', description: '经典奶茶，Q弹珍珠', tags: ['甜', '奶茶'] },
    { name: '芋泥波波茶', category: '奶茶', description: '香甜芋泥，Q弹波波', tags: ['甜', '奶茶'] },
    { name: '红豆奶茶', category: '奶茶', description: '香甜红豆，浓郁奶香', tags: ['甜', '奶茶'] },
    { name: '抹茶拿铁', category: '奶茶', description: '清香抹茶，丝滑奶泡', tags: ['清香', '奶茶'] },
    { name: '焦糖玛奇朵', category: '奶茶', description: '焦糖香甜，层次丰富', tags: ['甜', '奶茶'] },
    
    // 咖啡
    { name: '美式咖啡', category: '咖啡', description: '纯正咖啡，提神醒脑', tags: ['苦', '咖啡'] },
    { name: '拿铁咖啡', category: '咖啡', description: '香浓奶泡，温润口感', tags: ['香浓', '咖啡'] },
    { name: '卡布奇诺', category: '咖啡', description: '浓郁咖啡，绵密奶泡', tags: ['浓郁', '咖啡'] },
    { name: '摩卡咖啡', category: '咖啡', description: '巧克力香，甜苦平衡', tags: ['甜', '咖啡'] },
    
    // 果汁
    { name: '鲜榨橙汁', category: '果汁', description: '维C丰富，酸甜可口', tags: ['酸', '甜', '果汁'] },
    { name: '苹果汁', category: '果汁', description: '清甜爽口，营养健康', tags: ['甜', '果汁'] },
    { name: '西瓜汁', category: '果汁', description: '清热解暑，甘甜多汁', tags: ['甜', '解暑'] },
    { name: '柠檬蜂蜜茶', category: '茶饮', description: '酸甜清香，润燥养颜', tags: ['酸', '甜', '茶'] },
    
    // 汽水
    { name: '可口可乐', category: '汽水', description: '经典可乐，气泡爽快', tags: ['甜', '汽水'] },
    { name: '雪碧', category: '汽水', description: '柠檬清香，透心凉爽', tags: ['清爽', '汽水'] },
    { name: '橙味汽水', category: '汽水', description: '橙子香甜，气泡丰富', tags: ['甜', '汽水'] },
  ]

  // 插入菜品数据
  for (const dish of dishes) {
    await prisma.food.create({
      data: {
        ...dish,
        type: FoodType.DISH,
        isUserUploaded: false,
      },
    })
  }

  // 插入饮品数据
  for (const drink of drinks) {
    await prisma.food.create({
      data: {
        ...drink,
        type: FoodType.DRINK,
        isUserUploaded: false,
      },
    })
  }

  console.log('种子数据插入完成！')
  console.log(`插入了 ${dishes.length} 个菜品和 ${drinks.length} 个饮品`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
