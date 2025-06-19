import React, { useState, useEffect } from 'react';
import './Month-Slider.css';

const ExpandingCards = () => {
    // 패널 데이터
    const panels = [
        {
            id: 1,
            title: "Explore The World",
            image:
                "https://images.unsplash.com/photo-1558979158-65a1eaa08691?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        },
        {
            id: 2,
            title: "Wild Forest",
            image:
                "https://images.unsplash.com/photo-1572276596237-5db2c3e16c5d?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        },
        {
            id: 3,
            title: "Sunny Beach",
            image:
                "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?ixlib=rb-1.2.1&auto=format&fit=crop&w=1353&q=80",
        },
        {
            id: 4,
            title: "City on Winter",
            image:
                "https://images.unsplash.com/photo-1551009175-8a68da93d5f9?ixlib=rb-1.2.1&auto=format&fit=crop&w=1351&q=80",
        },
        {
            id: 5,
            title: "Mountains - Clouds",
            image:
                "https://images.unsplash.com/photo-1549880338-65ddcdfd017b?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80",
        },
    ];

    // 활성 패널 상태
    const [activePanel, setActivePanel] = useState(1);

    // 자동 패널 변경 (4초마다)
    useEffect(() => {
        const interval = setInterval(() => {
            setActivePanel((prev) => (prev % panels.length) + 1);
        }, 4000); // 4초마다 다음 패널로 이동

        return () => clearInterval(interval); // 컴포넌트 언마운트 시 정리
    }, [panels.length]);

    // 패널 클릭 시 수동 전환
    const handlePanelClick = (panelId) => {
        setActivePanel(panelId);
    };

    return (
        <div className="container">
            {panels.map((panel) => (
                <div
                    key={panel.id}
                    className={`panel ${activePanel === panel.id ? 'active' : ''}`}
                    style={{ backgroundImage: `url('${panel.image}')` }}
                    onClick={() => handlePanelClick(panel.id)}
                >
                    <h3>{panel.title}</h3>
                </div>
            ))}
        </div>
    );
};

export default ExpandingCards;
