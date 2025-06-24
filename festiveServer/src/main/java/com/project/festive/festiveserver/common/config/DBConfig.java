package com.project.festive.festiveserver.common.config;

import javax.sql.DataSource;

import org.apache.ibatis.session.SqlSessionFactory;
import org.mybatis.spring.SqlSessionFactoryBean;
import org.mybatis.spring.SqlSessionTemplate;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.context.ApplicationContext;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.data.jpa.repository.config.EnableJpaRepositories;
import org.springframework.orm.jpa.JpaTransactionManager;
import org.springframework.orm.jpa.LocalContainerEntityManagerFactoryBean;
import org.springframework.orm.jpa.vendor.HibernateJpaVendorAdapter;
import org.springframework.transaction.PlatformTransactionManager;

import com.zaxxer.hikari.HikariConfig;
import com.zaxxer.hikari.HikariDataSource;

import lombok.RequiredArgsConstructor;

@Configuration
@Profile("local")
@EnableJpaRepositories(basePackages = "com.project.festive.festiveserver")
@RequiredArgsConstructor
public class DBConfig {
  
  private final ApplicationContext applicationContext;

  @Bean
  @ConfigurationProperties(prefix = "spring.datasource.hikari")
  public HikariConfig hikariConfig() {
    return new HikariConfig();
  }

//  @Bean
//  public DataSource dataSource(HikariConfig hikariConfig) {
//
//    DataSource dataSource = new HikariDataSource(hikariConfig);
//
//    return dataSource;
//  }
  
  @Bean
  public DataSource dataSource() {
      HikariDataSource dataSource = new HikariDataSource();
      dataSource.setDriverClassName("oracle.jdbc.OracleDriver");
      dataSource.setJdbcUrl("jdbc:oracle:thin:@localhost:1521:xe");
      dataSource.setUsername("festiveTest");
      dataSource.setPassword("test1234");
      return dataSource;
  }


  @Bean
  public SqlSessionFactory sessionFactory(DataSource dataSource) throws Exception{
	
	  SqlSessionFactoryBean sessionFactoryBean = new SqlSessionFactoryBean();
		
	  sessionFactoryBean.setDataSource(dataSource);
		
	  sessionFactoryBean.setMapperLocations(applicationContext.getResources("classpath:/mappers/**.xml"));
	  sessionFactoryBean.setTypeAliasesPackage("com.project.festive.festiveserver");
		
	  sessionFactoryBean.setConfigLocation(applicationContext.getResource("classpath:mybatis-config.xml"));
	
	  return sessionFactoryBean.getObject();
  }
	
  @Bean
  public SqlSessionTemplate sqlSessionTemplate(SqlSessionFactory sessionFactory) {
	  return new SqlSessionTemplate(sessionFactory);
  }
	
  /**
   * JPA EntityManagerFactory를 생성하는 Bean
   * 
   * @param dataSource 데이터베이스 연결을 위한 DataSource
   * @return LocalContainerEntityManagerFactoryBean JPA 엔티티 매니저 팩토리
   * 
   * @description
   * - JPA를 사용하기 위한 EntityManagerFactory를 설정
   * - 엔티티 클래스들이 위치한 패키지를 스캔하여 JPA 엔티티로 등록
   * - Hibernate를 JPA 구현체로 사용하도록 설정
   */
  @Bean
  public LocalContainerEntityManagerFactoryBean entityManagerFactory(DataSource dataSource) {
    // JPA 엔티티 매니저 팩토리 빈 생성
    LocalContainerEntityManagerFactoryBean em = new LocalContainerEntityManagerFactoryBean();
    
    // 데이터베이스 연결 설정
    em.setDataSource(dataSource);
    
    // JPA 엔티티 클래스들이 위치한 패키지 경로 설정
    // 이 패키지 내의 @Entity 어노테이션이 붙은 클래스들을 자동으로 스캔
    em.setPackagesToScan("com.project.festive.festiveserver");
    
    // Hibernate를 JPA 구현체로 사용하도록 설정
    HibernateJpaVendorAdapter vendorAdapter = new HibernateJpaVendorAdapter();
    em.setJpaVendorAdapter(vendorAdapter);
    
    return em;
  }
	
  /**
   * JPA 트랜잭션 매니저를 생성하는 Bean
   * 
   * @param entityManagerFactory JPA 엔티티 매니저 팩토리
   * @return PlatformTransactionManager JPA 트랜잭션 매니저
   * 
   * @description
   * - JPA를 사용한 데이터베이스 트랜잭션 관리를 위한 트랜잭션 매니저를 설정
   * - @Transactional 어노테이션을 사용한 트랜잭션 처리를 담당
   * - 엔티티 매니저 팩토리와 연결하여 JPA 트랜잭션을 관리
   * - 데이터베이스 작업의 원자성(Atomicity), 일관성(Consistency), 
   *   격리성(Isolation), 지속성(Durability)을 보장
   */
  @Bean(name = "transactionManager")
  public PlatformTransactionManager transactionManager(LocalContainerEntityManagerFactoryBean entityManagerFactory) {
    // JPA 트랜잭션 매니저 생성
    JpaTransactionManager transactionManager = new JpaTransactionManager();
    
    // 엔티티 매니저 팩토리를 트랜잭션 매니저에 설정
    // 이를 통해 JPA 엔티티와 관련된 트랜잭션을 관리할 수 있음
    transactionManager.setEntityManagerFactory(entityManagerFactory.getObject());
    
    return transactionManager;
  }
}
