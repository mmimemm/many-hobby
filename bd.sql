-- Создание базы данных для сайта "MANY HOBBIES"
CREATE DATABASE IF NOT EXISTS many_hobbies CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE many_hobbies;


CREATE TABLE hobby_suggestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hobby_name VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  user_id INT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
 

-- Таблица категорий (хранит категории хобби, например, "Спорт", "Творчество")
CREATE TABLE categories (
    id INT AUTO_INCREMENT PRIMARY KEY,               -- Уникальный идентификатор категории
    name VARCHAR(255) NOT NULL UNIQUE,               -- Название категории, уникальное
    image VARCHAR(255) DEFAULT 'default_cat.jpg',    -- Путь к изображению категории
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP   -- Дата и время создания записи
);

-- Таблица хобби (хранит информацию о конкретных хобби)
CREATE TABLE hobbies (
    id INT AUTO_INCREMENT PRIMARY KEY,               -- Уникальный идентификатор хобби
    category_id INT NOT NULL,                        -- Связь с категорией (внешний ключ)
    name VARCHAR(255) NOT NULL,                      -- Название хобби
    description TEXT,                                -- Описание хобби
    images JSON,                                     -- Список путей к изображениям в формате JSON
    links JSON,                                      -- Список полезных ссылок в формате JSON
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Дата и время создания записи
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE -- Удаление хобби при удалении категории
);

-- Таблица избранного (хранит хобби, добавленные пользователями в избранное)
CREATE TABLE favorites (
    id INT AUTO_INCREMENT PRIMARY KEY,               -- Уникальный идентификатор записи
    user_id INT NOT NULL,                            -- Связь с пользователем (внешний ключ)
    hobby_id INT NOT NULL,                           -- Связь с хобби (внешний ключ)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,  -- Дата и время добавления
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,   -- Удаление записи при удалении пользователя
    FOREIGN KEY (hobby_id) REFERENCES hobbies(id) ON DELETE CASCADE -- Удаление записи при удалении хобби
);


CREATE TABLE logs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  hobby_id INT NOT NULL,
  visited_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (hobby_id) REFERENCES hobbies(id)
);


CREATE TABLE comments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  hobby_id INT NOT NULL,
  user_id INT NOT NULL,
  comment TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (hobby_id) REFERENCES hobbies(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

UPDATE hobbies SET images = '["/images/hobby1.jpg"]' WHERE id = 1;
UPDATE hobbies SET links = '[{"title": "Ссылка 1", "url": "http://example.com"}]';

ALTER TABLE hobbies ADD COLUMN category_id INT NOT NULL;
ALTER TABLE hobbies ADD CONSTRAINT fk_hobby_category FOREIGN KEY (category_id) REFERENCES categories(id); 
  
ALTER TABLE hobby_suggestions ADD COLUMN category_id INT DEFAULT NULL,
ADD CONSTRAINT fk_hobby_suggestions_category FOREIGN KEY (category_id) REFERENCES categories(id);

SELECT id, hobby_name, status, HEX(status) AS status_hex FROM hobby_suggestions WHERE id IN (48, 49);

UPDATE hobbies 
SET images = JSON_ARRAY(images) 
WHERE images NOT LIKE '[%' AND images IS NOT NULL;
  
UPDATE hobbies SET images = JSON_ARRAY(images) WHERE images NOT LIKE '[%';
  
INSERT INTO users (username, email, password, is_admin) 
VALUES ('admin', 'admin@example.com', 'adminpassword', TRUE);
 
INSERT INTO hobbies (category_id, name, description, images, links) VALUES (1, 'Бег', 'Бег для здоровья', '{"main": "images/hobbies/running.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Бег"}');

-- Вставка начальных данных для категорий (10 категорий)
INSERT INTO categories (name, image) VALUES
('Спорт', 'images/categories/sport.jpg'),
('Творчество', 'images/categories/art.jpg'),
('Музыка', 'images/categories/music.jpg'),
('Кулинария', 'images/categories/cooking.jpg'),
('Путешествия', 'images/categories/travel.jpg'),
('Технологии', 'images/categories/tech.jpg'),
('Садоводство', 'images/categories/gardening.jpg'),
('Фотография', 'images/categories/photography.jpg'),
('Игры', 'images/categories/games.jpg'),
('Рукоделие', 'images/categories/crafts.jpg');

-- Вставка начальных данных для хобби (по 8 хобби на категорию)
INSERT INTO hobbies (category_id, name, description, images, links) VALUES
(1, 'Бег', 'Отличный способ поддерживать форму.', '{"main": "images/hobbies/running.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Бег"}'),
(1, 'Плавание', 'Улучшает выносливость и здоровье.', '{"main": "images/hobbies/swimming.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Плавание"}'),
(1, 'Йога', 'Расслабление и гибкость тела.', '{"main": "images/hobbies/yoga.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Йога"}'),
(1, 'Велоспорт', 'Езда на велосипеде по городу или природе.', '{"main": "images/hobbies/cycling.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Велоспорт"}'),
(1, 'Футбол', 'Командная игра с мячом.', '{"main": "images/hobbies/football.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Футбол"}'),
(1, 'Теннис', 'Игра с ракеткой и мячом.', '{"main": "images/hobbies/tennis.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Теннис"}'),
(1, 'Бокс', 'Силовой вид спорта.', '{"main": "images/hobbies/boxing.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Бокс"}'),
(1, 'Гимнастика', 'Упражнения для гибкости и силы.', '{"main": "images/hobbies/gymnastics.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Гимнастика"}'),
(2, 'Рисование', 'Создание картин акварелью или маслом.', '{"main": "images/hobbies/painting.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Живопись"}'),
(2, 'Скульптура', 'Работа с глиной или деревом.', '{"main": "images/hobbies/sculpture.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Скульптура"}'),
(2, 'Фотография', 'Съемка пейзажей и портретов.', '{"main": "images/hobbies/photography.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Фотография"}'),
(2, 'Писательство', 'Создание рассказов и стихов.', '{"main": "images/hobbies/writing.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Литература"}'),
(2, 'Дизайн', 'Графический дизайн в Photoshop.', '{"main": "images/hobbies/design.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Графический_дизайн"}'),
(2, 'Вышивка', 'Вышивка крестиком или гладью.', '{"main": "images/hobbies/embroidery.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Вышивка"}'),
(2, 'Керамика', 'Изготовление керамических изделий.', '{"main": "images/hobbies/ceramics.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Керамика"}'),
(2, 'Коллаж', 'Создание коллажей из бумаги.', '{"main": "images/hobbies/collage.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Коллаж"}'),
(3, 'Гитара', 'Игра на акустической или электрической гитаре.', '{"main": "images/hobbies/guitar.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Гитара"}'),
(3, 'Фортепиано', 'Классическая музыка на пианино.', '{"main": "images/hobbies/piano.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Фортепиано"}'),
(3, 'Скрипка', 'Классическое исполнение на скрипке.', '{"main": "images/hobbies/violin.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Скрипка"}'),
(3, 'Барабаны', 'Ритмы и импровизация.', '{"main": "images/hobbies/drums.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Ударные_инструменты"}'),
(3, 'Вокал', 'Пение и развитие голоса.', '{"main": "images/hobbies/vocal.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Вокал"}'),
(3, 'Флейта', 'Игра на деревянных духовых инструментах.', '{"main": "images/hobbies/flute.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Флейта"}'),
(3, 'DJing', 'Смешивание треков и создание миксов.', '{"main": "images/hobbies/dj.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/DJ"}'),
(3, 'Композиция', 'Написание собственной музыки.', '{"main": "images/hobbies/composition.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Композитор"}'),
(4, 'Выпечка', 'Приготовление пирогов и тортов.', '{"main": "images/hobbies/baking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Выпечка"}'),
(4, 'Суши', 'Приготовление японских блюд.', '{"main": "images/hobbies/sushi.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Суши"}'),
(4, 'Гриль', 'Приготовление на открытом огне.', '{"main": "images/hobbies/grill.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Гриль"}'),
(4, 'Десерты', 'Создание сладостей и конфет.', '{"main": "images/hobbies/desserts.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Десерт"}'),
(4, 'Супы', 'Приготовление первых блюд.', '{"main": "images/hobbies/soups.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Суп"}'),
(4, 'Веганская кухня', 'Здоровые веганские рецепты.', '{"main": "images/hobbies/vegan.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Вегетарианство"}'),
(4, 'Коктейли', 'Приготовление алкогольных и безалкогольных напитков.', '{"main": "images/hobbies/cocktails.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Коктейль"}'),
(4, 'Итальянская кухня', 'Паста и пицца.', '{"main": "images/hobbies/italian.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Итальянская_кухня"}'),
(5, 'Пешие прогулки', 'Путешествия по горам и лесам.', '{"main": "images/hobbies/hiking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Пеший_туризм"}'),
(5, 'Кемпинг', 'Ночевка на природе.', '{"main": "images/hobbies/camping.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Кемпинг"}'),
(5, 'Экскурсии', 'Путешествия по городам.', '{"main": "images/hobbies/tours.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Экскурсия"}'),
(5, 'Автопутешествия', 'Поездки на автомобиле.', '{"main": "images/hobbies/cartravel.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Автопутешествия"}'),
(5, 'Круизы', 'Морские и речные путешествия.', '{"main": "images/hobbies/cruise.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Круиз"}'),
(5, 'Скалолазание', 'Подъем на скалы.', '{"main": "images/hobbies/climbing.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Скалолазание"}'),
(5, 'Сафари', 'Путешествия по дикой природе.', '{"main": "images/hobbies/safari.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Сафари"}'),
(5, 'Культурный туризм', 'Изучение истории и культуры.', '{"main": "images/hobbies/culture.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Культурный_туризм"}'),
(6, 'Программирование', 'Создание приложений и сайтов.', '{"main": "images/hobbies/coding.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Программирование"}'),
(6, 'Робототехника', 'Сборка и управление роботами.', '{"main": "images/hobbies/robotics.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Робототехника"}'),
(6, '3D-печать', 'Создание объектов с помощью 3D-принтера.', '{"main": "images/hobbies/3dprint.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/3D-печать"}'),
(6, 'Игровые консоли', 'Разработка игр для консолей.', '{"main": "images/hobbies/gamingconsole.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Игровая_консоль"}'),
(6, 'Искусственный интеллект', 'Изучение AI технологий.', '{"main": "images/hobbies/ai.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Искусственный_интеллект"}'),
(6, 'Сети', 'Настройка и администрирование сетей.', '{"main": "images/hobbies/networking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Компьютерная_сеть"}'),
(6, 'Аппаратное обеспечение', 'Сборка и ремонт ПК.', '{"main": "images/hobbies/hardware.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Компьютерное_железо"}'),
(6, 'Кибербезопасность', 'Защита данных и систем.', '{"main": "images/hobbies/cybersecurity.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Кибербезопасность"}'),
(7, 'Садовые цветы', 'Выращивание роз и тюльпанов.', '{"main": "images/hobbies/flowers.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Садоводство"}'),
(7, 'Овощи', 'Выращивание помидоров и огурцов.', '{"main": "images/hobbies/vegetables.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Огородничество"}'),
(7, 'Деревья', 'Уход за фруктовыми деревьями.', '{"main": "images/hobbies/trees.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Дендрология"}'),
(7, 'Ландшафтный дизайн', 'Создание красивых садов.', '{"main": "images/hobbies/landscape.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Ландшафтный_дизайн"}'),
(7, 'Комнатные растения', 'Уход за домашними растениями.', '{"main": "images/hobbies/indoorplants.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Комнатные_растения"}'),
(7, 'Орхидеи', 'Выращивание экзотических цветов.', '{"main": "images/hobbies/orchids.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Орхидеи"}'),
(7, 'Травы', 'Выращивание мяты и базилика.', '{"main": "images/hobbies/herbs.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Травы"}'),
(7, 'Бонсай', 'Искусство выращивания мини-деревьев.', '{"main": "images/hobbies/bonsai.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Бонсай"}'),
(8, 'Пейзажи', 'Съемка природы и закатов.', '{"main": "images/hobbies/landscapes.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Пейзажная_фотография"}'),
(8, 'Портреты', 'Съемка людей и эмоций.', '{"main": "images/hobbies/portraits.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Портретная_фотография"}'),
(8, 'Макро', 'Съемка мелких деталей.', '{"main": "images/hobbies/macro.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Макросъёмка"}'),
(8, 'Ночная съемка', 'Фотография звезд и городов.', '{"main": "images/hobbies/night.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Ночная_фотография"}'),
(8, 'Свадебная фотография', 'Съемка свадебных мероприятий.', '{"main": "images/hobbies/wedding.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Свадебная_фотография"}'),
(8, 'Животные', 'Съемка диких и домашних животных.', '{"main": "images/hobbies/animals.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Фотография_животных"}'),
(8, 'Аэрофотосъемка', 'Съемка с дронов.', '{"main": "images/hobbies/aerial.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Аэрофотосъёмка"}'),
(8, 'Ретро', 'Фотография в стиле vintage.', '{"main": "images/hobbies/retro.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Ретрофотография"}'),
(9, 'Шахматы', 'Стратегия и логика.', '{"main": "images/hobbies/chess.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Шахматы"}'),
(9, 'Видеоигры', 'Игры на ПК и консолях.', '{"main": "images/hobbies/videogames.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Видеоигры"}'),
(9, 'Настольные игры', 'Игры с друзьями.', '{"main": "images/hobbies/boardgames.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Настольные_игры"}'),
(9, 'Картые игры', 'Покер и другие карточные игры.', '{"main": "images/hobbies/cards.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Карточные_игры"}'),
(9, 'Квесты', 'Прохождение квестов в реальной жизни.', '{"main": "images/hobbies/quests.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Квест"}'),
(9, 'Ролевые игры', 'RPG и настольные ролевки.', '{"main": "images/hobbies/rpg.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Ролевые_игры"}'),
(9, 'Пазлы', 'Сборка мозаик.', '{"main": "images/hobbies/puzzles.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Пазл"}'),
(9, 'Спортивные игры', 'Игры на свежем воздухе.', '{"main": "images/hobbies/sportgames.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Спортивные_игры"}'),
(10, 'Вязание', 'Создание шарфов и свитеров.', '{"main": "images/hobbies/knitting.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Вязание"}'),
(10, 'Шитье', 'Пошив одежды и аксессуаров.', '{"main": "images/hobbies/sewing.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Шитьё"}'),
(10, 'Декупаж', 'Украшение предметов.', '{"main": "images/hobbies/decoupage.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Декупаж"}'),
(10, 'Мыловарение', 'Создание натурального мыла.', '{"main": "images/hobbies/soapmaking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Мыловарение"}'),
(10, 'Скрапбукинг', 'Создание альбомов и открыток.', '{"main": "images/hobbies/scrapbooking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Скрапбукинг"}'),
(10, 'Роспись по дереву', 'Декор деревянных поверхностей.', '{"main": "images/hobbies/woodpainting.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Роспись"}'),
(10, 'Изготовление свечей', 'Создание аромасвечей.', '{"main": "images/hobbies/candlemaking.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Изготовление_свечей"}'),
(10, 'Мозаика', 'Создание картин из кусочков.', '{"main": "images/hobbies/mosaic.jpg"}', '{"wiki": "https://ru.wikipedia.org/wiki/Мозаика"}');

